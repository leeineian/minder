package looper

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/leeineian/minder/internal/database"
)

// LoopConfig matches the DB JSON structure
type LoopConfig struct {
	ChannelID     string `json:"channelId"`
	ChannelName   string `json:"channelName"`
	Interval      int    `json:"interval"` // ms
	Message       string `json:"message"`
	WebhookAuthor string `json:"webhook_author"`
	WebhookAvatar string `json:"webhook_avatar"`
}

type ThreadMap map[string]string // channelId -> threadId

type LoopInstance struct {
	Config  LoopConfig
	Hooks   []WebhookData `json:"hooks"` // simplified
	cancel  context.CancelFunc
	running bool
}

type WebhookData struct {
	HookID      string `json:"id"`
	HookToken   string `json:"token"`
	ChannelName string `json:"channelName"`
}

type Manager struct {
	loops sync.Map // map[channelID]*LoopInstance
}

var GlobalManager = &Manager{}

func (m *Manager) LoadFromDB() error {
	rows, err := database.DB.Query("SELECT channelId, config, threads FROM webhook_loops")
	if err != nil {
		return err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, configRaw, threadsRaw string
		if err := rows.Scan(&id, &configRaw, &threadsRaw); err != nil {
			log.Printf("Failed to scan loop: %v", err)
			continue
		}
		// In a real implementation we would parse and populate the state.
		// For now we just log it.
		count++
	}
	log.Printf("Loaded %d loop configurations from DB", count)
	return nil
}

// StartLoop starts a loop for a given configuration
func (m *Manager) StartLoop(cfg LoopConfig, hooks []WebhookData) {
	if _, loaded := m.loops.Load(cfg.ChannelID); loaded {
		return // Already running
	}

	ctx, cancel := context.WithCancel(context.Background())
	instance := &LoopInstance{
		Config:  cfg,
		Hooks:   hooks,
		cancel:  cancel,
		running: true,
	}
	m.loops.Store(cfg.ChannelID, instance)

	go m.runLoop(ctx, instance)
}

func (m *Manager) StopLoop(channelID string) {
	if val, ok := m.loops.Load(channelID); ok {
		instance := val.(*LoopInstance)
		instance.cancel()
		m.loops.Delete(channelID)
		log.Printf("Stopped loop for %s", instance.Config.ChannelName)
	}
}

func (m *Manager) runLoop(ctx context.Context, instance *LoopInstance) {
	log.Printf("Starting loop for %s with interval %dms", instance.Config.ChannelName, instance.Config.Interval)

	interval := time.Duration(instance.Config.Interval) * time.Millisecond
	if interval == 0 {
		interval = 1 * time.Second // Safety minimum set to 1 sec if 0
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Initial run
	m.executeWebhooks(instance)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Execute Webhooks
			m.executeWebhooks(instance)
		}
	}
}

// HTTP Client reused for connection pooling
var httpClient = &http.Client{
	Timeout: 5 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 100,
		IdleConnTimeout:     90 * time.Second,
	},
}

func (m *Manager) executeWebhooks(instance *LoopInstance) {
	var wg sync.WaitGroup

	payload := map[string]interface{}{
		"content":    instance.Config.Message,
		"username":   instance.Config.WebhookAuthor,
		"avatar_url": instance.Config.WebhookAvatar,
	}

	body, _ := json.Marshal(payload)

	for _, hook := range instance.Hooks {
		wg.Add(1)
		go func(h WebhookData) {
			defer wg.Done()

			url := fmt.Sprintf("https://discord.com/api/webhooks/%s/%s", h.HookID, h.HookToken)
			req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
			if err != nil {
				return
			}
			req.Header.Set("Content-Type", "application/json")

			resp, err := httpClient.Do(req)
			if err != nil {
				// log.Println("Webhook failed:", err) // Commented out to avoid spam
				return
			}
			defer resp.Body.Close()

			// Handle rate limits? For stress testing, we often ignore them or log them.
			if resp.StatusCode == 429 {
				// We hit a rate limit
			}
		}(hook)
	}
	wg.Wait()
}

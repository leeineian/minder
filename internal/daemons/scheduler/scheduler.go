package scheduler

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/database"
)

type ReminderJob struct {
	ID        int
	UserID    string
	ChannelID string
	Message   string
	DueAt     time.Time
	timer     *time.Timer
}

var (
	jobs   = make(map[int]*ReminderJob)
	jobsMu sync.Mutex
)

// ScheduleReminder schedules a reminder for delivery
func ScheduleReminder(s *discordgo.Session, userID, channelID, message string, id int, dueAt time.Time) {
	jobsMu.Lock()
	defer jobsMu.Unlock()

	// Cancel existing if rescheduling
	if existing, ok := jobs[id]; ok {
		existing.timer.Stop()
	}

	delay := time.Until(dueAt)
	if delay < 0 {
		delay = 0
	}

	job := &ReminderJob{
		ID:        id,
		UserID:    userID,
		ChannelID: channelID,
		Message:   message,
		DueAt:     dueAt,
	}

	job.timer = time.AfterFunc(delay, func() {
		sendReminder(s, job)
	})

	jobs[id] = job
	log.Printf("Scheduled reminder %d for %s", id, dueAt.Format(time.RFC3339))
}

// CancelReminder cancels a scheduled reminder
func CancelReminder(id int) {
	jobsMu.Lock()
	defer jobsMu.Unlock()

	if job, ok := jobs[id]; ok {
		job.timer.Stop()
		delete(jobs, id)
		log.Printf("Cancelled reminder %d", id)
	}
}

func sendReminder(s *discordgo.Session, job *ReminderJob) {
	content := fmt.Sprintf("⏰ **Time's Up, <@%s>!**\nReminder: \"%s\"", job.UserID, job.Message)

	// Try to send DM to user
	channel, err := s.UserChannelCreate(job.UserID)
	if err == nil {
		_, err = s.ChannelMessageSend(channel.ID, content)
		if err == nil {
			// Success - delete from DB
			database.DB.Exec("DELETE FROM reminders WHERE id = ?", job.ID)
			jobsMu.Lock()
			delete(jobs, job.ID)
			jobsMu.Unlock()
			log.Printf("Reminder %d delivered via DM", job.ID)
			return
		}
		log.Printf("DM failed for reminder %d: %v", job.ID, err)
	}

	// Fallback to channel if DM fails
	if job.ChannelID != "" {
		_, err = s.ChannelMessageSend(job.ChannelID, content)
		if err != nil {
			log.Printf("Failed to send reminder %d to channel: %v", job.ID, err)
			return
		}

		// Delete from DB
		database.DB.Exec("DELETE FROM reminders WHERE id = ?", job.ID)
		jobsMu.Lock()
		delete(jobs, job.ID)
		jobsMu.Unlock()
		log.Printf("Reminder %d delivered via channel fallback", job.ID)
	} else {
		log.Printf("Reminder %d failed: no DM and no channel fallback", job.ID)
	}
}

// RestoreReminders loads pending reminders from DB on startup
func RestoreReminders(s *discordgo.Session) error {
	rows, err := database.DB.Query(
		"SELECT id, userId, channelId, message, time FROM reminders WHERE active = 1",
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id int
		var userID, channelID, message string
		var timeUnix int64

		if err := rows.Scan(&id, &userID, &channelID, &message, &timeUnix); err != nil {
			continue
		}

		dueAt := time.Unix(timeUnix, 0)
		if dueAt.After(time.Now()) {
			ScheduleReminder(s, userID, channelID, message, id, dueAt)
			count++
		}
	}

	log.Printf("Restored %d pending reminders", count)
	return nil
}

const { describe, test, expect, mock } = require('bun:test');

// ============================================================================
// DATABASE
// ============================================================================
const db = require('../../src/utils/core/database');

describe('Database - Reminders', () => {
    test('should add and retrieve reminder', () => {
        const userId = 'test123';
        const channelId = 'channel123';
        const message = 'Test reminder';
        const triggerAt = Date.now() + 60000;

        const id = db.addReminder(userId, channelId, message, triggerAt);
        expect(id).toBeGreaterThan(0);

        const reminders = db.getReminders(userId);
        expect(reminders.length).toBeGreaterThan(0);

        const found = reminders.find(r => r.id === id);
        expect(found).toBeDefined();
        expect(found.message).toBe(message);

        db.deleteReminder(id);
    });

    test('should delete reminder by ID', () => {
        const id = db.addReminder('user1', 'ch1', 'Delete me', Date.now() + 1000);
        
        db.deleteReminder(id);
        const reminders = db.getReminders('user1');
        const found = reminders.find(r => r.id === id);
        expect(found).toBeUndefined();
    });

    test('should delete all reminders for user', () => {
        const userId = 'bulk_test';
        db.addReminder(userId, 'ch1', 'msg1', Date.now() + 1000);
        db.addReminder(userId, 'ch1', 'msg2', Date.now() + 2000);

        db.deleteAllReminders(userId);
        const reminders = db.getReminders(userId);
        expect(reminders.length).toBe(0);
    });

    test('should count reminders correctly', () => {
        const userId = 'count_test';
        db.deleteAllReminders(userId);

        db.addReminder(userId, 'ch1', 'msg1', Date.now() + 1000);
        db.addReminder(userId, 'ch1', 'msg2', Date.now() + 2000);

        const count = db.getRemindersCount(userId);
        expect(count).toBe(2);

        db.deleteAllReminders(userId);
    });

    test('should get all reminders', () => {
        const userId = 'getall_test';
        db.deleteAllReminders(userId);

        db.addReminder(userId, 'ch1', 'msg1', Date.now() + 1000);
        db.addReminder(userId, 'ch1', 'msg2', Date.now() + 2000);

        const all = db.getReminders(userId);
        expect(all.length).toBe(2);

        db.deleteAllReminders(userId);
    });

    test('should mark reminder as sent (idempotency)', () => {
        const id = db.addReminder('user1', 'ch1', 'Mark sent', Date.now() - 1000);

        db.markReminderAsSent(id);
        let reminder = db.getReminders('user1').find(r => r.id === id);
        expect(reminder.sent_at).toBeDefined();

        const firstSentTime = reminder.sent_at;
        db.markReminderAsSent(id);
        reminder = db.getReminders('user1').find(r => r.id === id);
        expect(reminder.sent_at).toBe(firstSentTime);

        db.deleteReminder(id);
    });
});

describe('Database - Guild Config', () => {
    test('should set and get guild config', () => {
        const guildId = 'guild123';
        const config = { prefix: '!', autoLog: true };
        
        db.setGuildConfig(guildId, config);
        const retrieved = db.getGuildConfig(guildId);
        
        expect(retrieved).toEqual(config);
    });

    test('should return null for non-existent guild config', () => {
        const retrieved = db.getGuildConfig('missing_guild');
        expect(retrieved).toBeNull();
    });

    test('should update existing guild config', () => {
        const guildId = 'update_guild';
        db.setGuildConfig(guildId, { a: 1 });
        db.setGuildConfig(guildId, { a: 2, b: 3 });
        
        const retrieved = db.getGuildConfig(guildId);
        expect(retrieved).toEqual({ a: 2, b: 3 });
    });
});

describe('Database - AI Config', () => {
    test('should set and get user prompt', () => {
        const userId = 'user_ai';
        const prompt = 'Custom prompt';
        
        db.ai.setPrompt(userId, prompt);
        const retrieved = db.ai.getPrompt(userId);
        
        expect(retrieved).toBe(prompt);
    });

    test('should reset user prompt', () => {
        const userId = 'reset_ai';
        db.ai.setPrompt(userId, 'prompt');
        db.ai.deletePrompt(userId);
        
        const retrieved = db.ai.getPrompt(userId);
        expect(retrieved).toBeUndefined();
    });
});

describe('Database - Webhook Looper', () => {
    test('should add and manage loop configs', () => {
        const channelId = 'chan_loop';
        const config = { 
            channelName: 'Test Chan',
            channelType: 'channel',
            rounds: 0,
            interval: 60000, 
            logs: true 
        };
        
        db.webhookLooper.addLoopConfig(channelId, config);
        const all = db.webhookLooper.getAllLoopConfigs();
        
        const found = all.find(c => c.channelId === channelId);
        expect(found).toBeDefined();
        expect(found.channelName).toBe('Test Chan');
        expect(found.isRunning).toBe(0); // Default
    });

    test('should update loop state', () => {
        const channelId = 'state_loop';
        db.webhookLooper.addLoopConfig(channelId, { 
            channelName: 'State Chan',
            channelType: 'channel',
            rounds: 0,
            interval: 0
        });
        
        db.webhookLooper.setLoopState(channelId, 1);
        const all = db.webhookLooper.getAllLoopConfigs();
        const found = all.find(c => c.channelId === channelId);
        
        expect(found.isRunning).toBe(1);
    });
});


// ============================================================================
// COMPONENTS (V2Builder)
// ============================================================================
const V2Builder = require('../../src/utils/core/components');

describe('V2Builder - Discord Components V2', () => {
    test('should create container', () => {
        const container = V2Builder.container([]);
        expect(container).toBeDefined();
        expect(container.type).toBeDefined();
    });

    test('should create text display', () => {
        const text = V2Builder.textDisplay('Hello');
        expect(text).toBeDefined();
        expect(text.type).toBeDefined();
        expect(text.content).toBe('Hello');
    });

    test('should create button', () => {
        const button = V2Builder.button('Click me', 'btn_id', 1);
        expect(button).toBeDefined();
        expect(button.type).toBe(2);
        expect(button.label).toBe('Click me');
        expect(button.custom_id).toBe('btn_id');
    });

    test('should create action row', () => {
        const row = V2Builder.actionRow([]);
        expect(row).toBeDefined();
        expect(row.type).toBe(1);
    });

    test('should create media gallery', () => {
        const gallery = V2Builder.mediaGallery([{ media: { url: 'http://example.com/img.jpg' } }]);
        expect(gallery).toBeDefined();
        expect(gallery.type).toBeDefined();
    });

    test('should create section', () => {
        const section = V2Builder.section('Title');
        expect(section).toBeDefined();
        expect(section.type).toBeDefined();
    });

    test('should create thumbnail', () => {
        const thumb = V2Builder.thumbnail('http://example.com/thumb.jpg');
        expect(thumb).toBeDefined();
        expect(thumb.type).toBeDefined();
    });
});

// ============================================================================
// CONSOLE LOGGER
// ============================================================================
const ConsoleLogger = require('../../src/utils/log/consoleLogger');

describe('ConsoleLogger', () => {
    test('should have info, warn, error, success, and debug methods', () => {
        expect(typeof ConsoleLogger.info).toBe('function');
        expect(typeof ConsoleLogger.warn).toBe('function');
        expect(typeof ConsoleLogger.error).toBe('function');
        expect(typeof ConsoleLogger.success).toBe('function');
        expect(typeof ConsoleLogger.debug).toBe('function');
    });

    test('info should format with category and message', () => {
        // Temporarily restore original ConsoleLogger.info for this test
        const mockedInfo = ConsoleLogger.info;
        ConsoleLogger.info = global.__originalConsoleLoggerMethods.info;

        const originalLog = console.log;
        const mockLog = mock(() => {});
        console.log = mockLog;

        ConsoleLogger.info('TestCategory', 'Test message');
        
        expect(mockLog).toHaveBeenCalled();

        console.log = originalLog;
        // Restore the mock for other tests
        ConsoleLogger.info = mockedInfo;
    });

    test('error should call console.error', () => {
        // Temporarily restore original ConsoleLogger.error for this test
        const mockedError = ConsoleLogger.error;
        ConsoleLogger.error = global.__originalConsoleLoggerMethods.error;

        const originalError = console.error;
        const mockError = mock(() => {});
        console.error = mockError;

        ConsoleLogger.error('ErrorTest', 'Error occurred');
        
        expect(mockError).toHaveBeenCalled();

        console.error = originalError;
        // Restore the mock for other tests
        ConsoleLogger.error = mockedError;
    });

    test('should have getTimestamp method', () => {
        expect(typeof ConsoleLogger.getTimestamp).toBe('function');
        const timestamp = ConsoleLogger.getTimestamp();
        expect(typeof timestamp).toBe('string');
        expect(timestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    test('should have formatMessage method', () => {
        expect(typeof ConsoleLogger.formatMessage).toBe('function');
        const formatted = ConsoleLogger.formatMessage('Test', 'message');
        expect(formatted).toContain('Test');
        expect(formatted).toContain('message');
    });
});

// ============================================================================
// CODEBASE UTILITIES
// ============================================================================
const codebase = require('../../src/utils/core/codebase');

describe('Codebase Utilities', () => {
    test('getStructure should return array of file paths', () => {
        const structure = codebase.getStructure();
        
        expect(Array.isArray(structure)).toBe(true);
        expect(structure.length).toBeGreaterThan(0);
        
        // All returned items should be relative paths
        structure.forEach(file => {
            expect(typeof file).toBe('string');
            expect(file).toMatch(/^src\//);
        });
    });

    test('getStructure should include JS files', () => {
        const structure = codebase.getStructure();
        const jsFiles = structure.filter(f => f.endsWith('.js'));
        
        expect(jsFiles.length).toBeGreaterThan(0);
    });

    test('refreshStructure should return updated structure', () => {
        const structure = codebase.refreshStructure();
        
        expect(Array.isArray(structure)).toBe(true);
        expect(structure.length).toBeGreaterThan(0);
    });

    test('readFile should return file content for valid paths', () => {
        const content = codebase.readFile('src/utils/core/codebase.js');
        
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
    });

    test('readFile should return null for invalid paths', () => {
        const content = codebase.readFile('/etc/passwd');
        expect(content).toBeNull();
    });

    test('readFile should return null for non-existent files', () => {
        const content = codebase.readFile('src/nonexistent.js');
        expect(content).toBeNull();
    });
});

// ============================================================================
// TIMER UTILITIES
// ============================================================================
const timer = require('../../src/utils/core/timer');

describe('Timer Utilities', () => {
    test('setLongTimeout should execute callback for short delay', async () => {
        let executed = false;
        const start = Date.now();
        
        await new Promise(resolve => {
            timer.setLongTimeout(() => {
                executed = true;
                resolve();
            }, 10);
        });
        
        expect(executed).toBe(true);
        expect(Date.now() - start).toBeGreaterThanOrEqual(10);
    });

    test('setLongTimeout should pass arguments to callback', async () => {
        let receivedArg = null;
        
        await new Promise(resolve => {
            timer.setLongTimeout((arg) => {
                receivedArg = arg;
                resolve();
            }, 5, 'test-arg');
        });
        
        expect(receivedArg).toBe('test-arg');
    });

    test('setLongTimeout cancel should prevent execution', async () => {
        let executed = false;
        
        const t = timer.setLongTimeout(() => {
            executed = true;
        }, 20);
        
        t.cancel();
        
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(executed).toBe(false);
    });

    test('setLongTimeout should handle multiple steps for long delays', (done) => {
        // We can't actually wait for a long delay in tests, 
        // but we can verify the recursive logic works by mocking setTimeout
        const originalSetTimeout = global.setTimeout;
        const MAX_DELAY = 2147483647;
        let setTimeouts = [];
        
        global.setTimeout = (cb, delay) => {
            setTimeouts.push({ cb, delay });
            return 123; // Fake ID
        };
        
        let executed = false;
        const longDelay = MAX_DELAY + 1000;
        
        timer.setLongTimeout(() => {
            executed = true;
        }, longDelay);
        
        // Should have scheduled the first step
        expect(setTimeouts.length).toBe(1);
        expect(setTimeouts[0].delay).toBe(MAX_DELAY);
        
        // Trigger the first callback
        setTimeouts[0].cb();
        
        // Should have scheduled the second (final) step
        expect(setTimeouts.length).toBe(2);
        expect(setTimeouts[1].delay).toBe(1000);
        
        // Restore setTimeout before finishing
        global.setTimeout = originalSetTimeout;
        done();
    });
});


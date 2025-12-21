import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import db from '../../src/utils/database';

describe('Database - Reminders', () => {
    const TEST_USER = 'test-user-12345';
    const TEST_CHANNEL = 'test-channel-67890';
    
    beforeEach(() => {
        // Clear test data before each test
        db.deleteAllReminders(TEST_USER);
    });

    afterEach(() => {
        // Cleanup after each test
        db.deleteAllReminders(TEST_USER);
    });

    test('should add and retrieve reminder', () => {
        const dueAt = Date.now() + 60000;
        const id = db.addReminder(
            TEST_USER,
            TEST_CHANNEL,
            'Test reminder message',
            dueAt,
            'dm'
        );

        expect(id).toBeGreaterThan(0);

        const reminders = db.getReminders(TEST_USER);
        expect(reminders).toHaveLength(1);
        expect(reminders[0].message).toBe('Test reminder message');
        expect(reminders[0].deliveryType).toBe('dm');
        expect(reminders[0].userId).toBe(TEST_USER);
        expect(reminders[0].dueAt).toBe(dueAt);
    });

    test('should delete reminder by ID', () => {
        const id = db.addReminder(TEST_USER, TEST_CHANNEL, 'Test', Date.now() + 60000);
        
        const deleted = db.deleteReminder(id);
        expect(deleted).toBe(1);

        const reminders = db.getReminders(TEST_USER);
        expect(reminders).toHaveLength(0);
    });

    test('should delete all reminders for user', () => {
        db.addReminder(TEST_USER, TEST_CHANNEL, 'Test 1', Date.now() + 60000);
        db.addReminder(TEST_USER, TEST_CHANNEL, 'Test 2', Date.now() + 120000);
        db.addReminder(TEST_USER, TEST_CHANNEL, 'Test 3', Date.now() + 180000);

        const deleted = db.deleteAllReminders(TEST_USER);
        expect(deleted).toBe(3);

        const reminders = db.getReminders(TEST_USER);
        expect(reminders).toHaveLength(0);
    });

    test('should count reminders correctly', () => {
        db.addReminder(TEST_USER, TEST_CHANNEL, 'Test 1', Date.now() + 60000);
        db.addReminder(TEST_USER, TEST_CHANNEL, 'Test 2', Date.now() + 120000);

        const count = db.getRemindersCount(TEST_USER);
        expect(count).toBe(2);

        const totalCount = db.getRemindersCount();
        expect(totalCount).toBeGreaterThanOrEqual(2);
    });

    test('should get all pending reminders', () => {
        db.addReminder(TEST_USER, TEST_CHANNEL, 'Test 1', Date.now() + 60000);
        db.addReminder(TEST_USER, TEST_CHANNEL, 'Test 2', Date.now() + 120000);

        const pending = db.getAllPendingReminders();
        const userReminders = pending.filter(r => r.userId === TEST_USER);
        
        expect(userReminders.length).toBeGreaterThanOrEqual(2);
    });

    test('should mark reminder as sent (idempotency)', () => {
        const id = db.addReminder(TEST_USER, TEST_CHANNEL, 'Test', Date.now() + 60000);

        // First mark should succeed
        const marked1 = db.markReminderAsSent(id);
        expect(marked1).toBe(true);

        // Second mark should fail (already sent)
        const marked2 = db.markReminderAsSent(id);
        expect(marked2).toBe(false);
    });

    test('should reset sent status', () => {
        const id = db.addReminder(TEST_USER, TEST_CHANNEL, 'Test', Date.now() + 60000);

        // Mark as sent
        db.markReminderAsSent(id);
        
        // Verify cannot mark again
        expect(db.markReminderAsSent(id)).toBe(false);

        // Reset sent status
        const reset = db.resetReminderSentStatus(id);
        expect(reset).toBe(1);

        // Should be able to mark again
        expect(db.markReminderAsSent(id)).toBe(true);
    });
});

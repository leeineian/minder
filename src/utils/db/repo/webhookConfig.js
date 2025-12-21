const db = require('../client');
const ConsoleLogger = require('../../consoleLogger');

// Cache prepared statements
const stmt = {
    add: db.prepare('INSERT OR REPLACE INTO ping_categories (categoryId, categoryName) VALUES (?, ?)'),
    getAll: db.prepare('SELECT * FROM ping_categories'),
    delete: db.prepare('DELETE FROM ping_categories WHERE categoryId = ?'),
    clearAll: db.prepare('DELETE FROM ping_categories')
};

const addRawCategory = (categoryId, categoryName) => {
    try {
        return stmt.add.run(categoryId, categoryName);
    } catch (error) {
        ConsoleLogger.error('Database', 'Failed to add ping category:', error);
        throw error;
    }
};

const getAllRawCategories = () => {
    try {
        return stmt.getAll.all();
    } catch (error) {
        ConsoleLogger.error('Database', 'Failed to get all ping categories:', error);
        return [];
    }
};

const deleteRawCategory = (categoryId) => {
    try {
        return stmt.delete.run(categoryId);
    } catch (error) {
        ConsoleLogger.error('Database', 'Failed to delete ping category:', error);
        throw error;
    }
};

const clearAllRawCategories = () => {
    try {
        return stmt.clearAll.run();
    } catch (error) {
        ConsoleLogger.error('Database', 'Failed to clear all ping categories:', error);
        throw error;
    }
};

module.exports = {
    addRawCategory,
    getAllRawCategories,
    deleteRawCategory,
    clearAllRawCategories
};


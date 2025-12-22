/**
 * Debug Command Helpers
 * Shared utilities for debug subcommands
 */

// --- ANSI Colors ---
const ANSI = {
    reset: '\u001b[0m',
    bold: '\u001b[1m',
    dim: '\u001b[2m',
    gray: '\u001b[30;1m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    pink: '\u001b[35m',
    pink_bold: '\u001b[35;1m',
    cyan: '\u001b[36m',
    white: '\u001b[37m',
};

const fmt = ANSI;

/**
 * Strips ANSI escape codes from a string
 * @param {string} str 
 * @returns {string} Clean string
 */
const stripAnsi = (str) => typeof str === 'string' ? str.replace(/\x1B\[\d+m/g, '') : str;

const title = (text) => `${fmt.pink}${text}${fmt.reset}`;
title.plain = (text) => text;

const key = (text) => `${fmt.pink}> ${text}:${fmt.reset}`;
key.plain = (text) => `> ${text}:`;

const val = (text) => `${fmt.pink_bold}${text}${fmt.reset}`;
val.plain = (text) => text;

/**
 * Format milliseconds to human-readable interval
 * @param {number} ms 
 * @returns {string} e.g. "5s", "10min", "infinite"
 */
function formatInterval(ms) {
    if (ms === 0) return 'infinite';
    if (ms < 60000) return `${ms / 1000}s`;
    if (ms < 3600000) return `${ms / 60000}min`;
    return `${ms / 3600000}h`;
}

module.exports = {
    ANSI,
    stripAnsi,
    title,
    key,
    val,
    formatInterval
};

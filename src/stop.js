const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const PID_FILE = path.join(__dirname, '../.bot.pid');

try {
    // 1. Try PID file first (Precision Kill)
    if (fs.existsSync(PID_FILE)) {
        const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
        if (pid) {
            try {
                process.kill(pid, 0); // Check if exists
                console.log(chalk.red(`[Stop] Killing process ${pid} from PID file...`));
                process.kill(pid, 'SIGTERM'); // Polite kill
                
                // Optional: Force kill if it doesn't die
                /* 
                setTimeout(() => {
                    try { process.kill(pid, 'SIGKILL'); } catch (e) {}
                }, 1000); 
                */
                
                // Cleanup PID file
                fs.unlinkSync(PID_FILE);
                console.log(chalk.green('[Stop] Successfully stopped bot using PID.'));
                process.exit(0);
            } catch (e) {
                console.log(chalk.yellow(`[Stop] Process ${pid} not running or already stopped.`));
                fs.unlinkSync(PID_FILE); // Stale file
            }
        }
    }

    // 2. Fallback: Grep (Safety Net)
    console.log(chalk.dim('[Stop] PID file not found/active. Checking process list...'));
    
    // Get all processes with detailed arguments
    const cmd = "ps -eo pid,args";
    const output = execSync(cmd).toString();
    
    // Parse lines
    const pidsToKill = output.split('\n')
        .filter(line => {
            // Must contain bun and src/start.js
            if (!line.includes('bun') || !line.includes('src/start.js')) return false;
            
            // EXCLUSIONS:
            if (line.includes('grep')) return false;
            if (line.includes('npm')) return false;
            if (line.includes('stop.js')) return false;
            if (line.includes('&&')) return false;
            if (line.includes('bun run start')) return false;
            // Exclude current process just in case
            if (line.trim().startsWith(String(process.pid))) return false;

            return true;
        })
        .map(line => line.trim().split(/\s+/)[0])
        .filter(Boolean);

    if (pidsToKill.length > 0) {
        console.log(chalk.red(`[Stop] Killing active processes found via search: ${pidsToKill.join(', ')}`));
        execSync(`kill -9 ${pidsToKill.join(' ')}`);
    } else {
        console.log(chalk.yellow('[Stop] No active bot processes found.'));
    }

} catch (error) {
    console.error(chalk.red('[Stop] Error during stop sequence:'), error);
}

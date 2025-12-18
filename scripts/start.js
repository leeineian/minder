const { execSync, spawn } = require('child_process');

console.log('Checking for zombie processes...');

try {
    execSync('pkill -f "node index.js"');
    console.log('Zombie process killed.');
} catch (error) {
    console.log('No zombie processes found.');
}

console.log('Starting Minder...');

const child = spawn('node', ['index.js'], { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env
});

const cleanup = (signal) => {
    console.log(`\nReceived ${signal}. Terminating child process...`);
    if (child) {
        child.kill();
    }
    process.exit(0);
};

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));

child.on('close', (code) => {
    console.log(`Bot exited with code ${code}`);
    process.exit(code);
});

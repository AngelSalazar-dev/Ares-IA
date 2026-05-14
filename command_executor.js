const { exec, spawn } = require('child_process');
const path = require('path');

const ALLOWED_COMMANDS = [
    'code', 'npm', 'node', 'git', 'docker', 'python', 'pip',
    'cd', 'dir', 'ls', 'type', 'mkdir', 'del', 'rm', 'cp', 'mv',
    'curl', 'wget', 'ping', 'ipconfig', 'tasklist', 'taskkill',
    'start', 'explorer', 'notepad', 'cmd', 'powershell'
];

const DANGEROUS_PATTERNS = [
    /format/i, /del\s+\/f/i, /rm\s+-rf/i, /drop\s+table/i,
    /shutdown/i, /reg\s+delete/i, /mkfs/i, /explorer\.exe/i,
    /wininit\.exe/i, /services\.exe/i, /lsass\.exe/i, /csrss\.exe/i
];

function isCommandAllowed(cmd) {
    const firstWord = cmd.split(' ')[0].toLowerCase();
    const isAllowed = ALLOWED_COMMANDS.some(allowed => 
        cmd.toLowerCase().startsWith(allowed) || firstWord === allowed
    );
    
    const isDangerous = DANGEROUS_PATTERNS.some(pattern => pattern.test(cmd));
    
    return isAllowed && !isDangerous;
}

function executeShellCommand(command) {
    return new Promise((resolve, reject) => {
        if (!isCommandAllowed(command)) {
            reject({ error: 'Comando no permitido o potencialmente peligroso' });
            return;
        }
        
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/bash';
        const shellArg = isWindows ? '/c' : '-c';
        
        const child = exec(`${shell} ${shellArg} "${command}"`, {
            cwd: process.cwd(),
            timeout: 30000,
            maxBuffer: 1024 * 1024
        }, (error, stdout, stderr) => {
            if (error) {
                if (error.killed) {
                    reject({ error: 'Comando cancelado por timeout' });
                } else {
                    reject({ error: error.message, stderr });
                }
                return;
            }
            
            resolve({ stdout, stderr, success: true });
        });
    });
}

function mouseAction(type, x, y) {
    return new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        
        if (type === 'click') {
            const cmd = isWindows 
                ? `powershell -command "[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x},${y}); [System.Windows.Forms.MouseEvents]::LeftClick.Invoke()`
                : `xdotool mousemove ${x} ${y} click 1`;
            
            exec(cmd, (error) => {
                if (error) reject({ error: error.message });
                else resolve({ success: true, action: `click at ${x},${y}` });
            });
        } else if (type === 'move') {
            const cmd = isWindows
                ? `powershell -command "[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x},${y})"`
                : `xdotool mousemove ${x} ${y}`;
            
            exec(cmd, (error) => {
                if (error) reject({ error: error.message });
                else resolve({ success: true, action: `moved to ${x},${y}` });
            });
        }
    });
}

function keyboardType(text) {
    return new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        
        const cmd = isWindows
            ? `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${text.replace(/'/g, "''")}')"`
            : `xdotool type '${text}'`;
        
        exec(cmd, (error) => {
            if (error) reject({ error: error.message });
            else resolve({ success: true, action: `typed: ${text}` });
        });
    });
}

module.exports = {
    executeShellCommand,
    mouseAction,
    keyboardType
};
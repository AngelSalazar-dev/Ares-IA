const { exec, spawn } = require('child_process');
const path = require('path');

// Comandos permitidos (whitelist)
const ALLOWED_COMMANDS = [
    'code', 'npm', 'node', 'git', 'docker', 'python', 'pip',
    'cd', 'dir', 'ls', 'type', 'mkdir', 'del', 'rm', 'cp', 'mv',
    'curl', 'wget', 'ping', 'ipconfig', 'tasklist', 'taskkill',
    'start', 'explorer', 'notepad', 'cmd', 'powershell',
    'calc', 'spotify', 'chrome', 'msedge', 'firefox', 'control',
    'taskmgr', 'write', 'mspaint', 'sndvol'
];

// Patrones peligrosos (rechazados)
const DANGEROUS_PATTERNS = [
    /format/i, /del\s+\/f/i, /rm\s+-rf/i, /drop\s+table/i,
    /shutdown/i, /reg\s+delete/i, /mkfs/i, /explorer\.exe/i,
    /wininit\.exe/i, /services\.exe/i, /lsass\.exe/i, /csrss\.exe/i
];

// Caracteres de inyección de comandos (rechazados)
const INJECTION_PATTERNS = [
    /[;&|`$]/,           // Shell injection
    /\.\.\//,            // Path traversal
    /\n|\r/,             // Newlines
    />|</,               // Redirects
    /\|\|/,              // OR operator
    /&&/,                // AND operator
    /\$\(/,              // Command substitution
    /`[^`]*`/,           // Backticks
];

// Límites de seguridad
const MAX_COMMAND_LENGTH = 500;
const MAX_TEXT_LENGTH = 100;

/**
 * Sanitiza un comando eliminando caracteres peligrosos
 */
function sanitizeCommand(cmd) {
    if (!cmd || typeof cmd !== 'string') return '';
    
    let sanitized = cmd.trim();
    
    // Remover comillas circundantes
    sanitized = sanitized.replace(/^['"]|['"]$/g, '');
    
    // Remover espacios múltiples
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    return sanitized;
}

/**
 * Verifica si un comando es seguro (no contiene inyección)
 */
function isCommandSafe(cmd) {
    // Verificar longitud
    if (cmd.length > MAX_COMMAND_LENGTH) {
        return { safe: false, reason: `Comando demasiado largo (${cmd.length}/${MAX_COMMAND_LENGTH})` };
    }
    
    // Verificar patrones de inyección
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(cmd)) {
            return { safe: false, reason: `Carácter peligroso detectado: ${pattern}` };
        }
    }
    
    return { safe: true };
}

/**
 * Verifica si el comando está en la whitelist
 */
function isCommandAllowed(cmd) {
    const firstWord = cmd.split(' ')[0].toLowerCase();
    const isAllowed = ALLOWED_COMMANDS.some(allowed => 
        cmd.toLowerCase().startsWith(allowed) || firstWord === allowed
    );
    
    const isDangerous = DANGEROUS_PATTERNS.some(pattern => pattern.test(cmd));
    
    return isAllowed && !isDangerous;
}

/**
 * Ejecuta un comando del shell de forma segura
 */
function executeShellCommand(command) {
    return new Promise((resolve, reject) => {
        // Sanitizar
        let sanitizedCmd = sanitizeCommand(command);
        
        // Verificar seguridad
        const safetyCheck = isCommandSafe(sanitizedCmd);
        if (!safetyCheck.safe) {
            console.log(`[SECURITY] ❌ Comando bloqueado: ${safetyCheck.reason}`);
            reject({ error: `Comando bloqueado: ${safetyCheck.reason}` });
            return;
        }
        
        // Verificar whitelist
        if (!isCommandAllowed(sanitizedCmd)) {
            console.log(`[SECURITY] ❌ Comando no permitido: ${sanitizedCmd}`);
            reject({ error: `Comando no permitido: ${sanitizedCmd}` });
            return;
        }
        
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/bash';
        const shellArg = isWindows ? '/c' : '-c';
        
        const child = exec(`${shell} ${shellArg} "${sanitizedCmd}"`, {
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

/**
 * Acción del mouse (click/move)
 */
function mouseAction(type, x, y) {
    return new Promise((resolve, reject) => {
        // Validar coordenadas
        const numX = parseInt(x);
        const numY = parseInt(y);
        
        if (isNaN(numX) || isNaN(numY)) {
            return reject({ error: 'Coordenadas inválidas' });
        }
        
        if (numX < 0 || numX > 10000 || numY < 0 || numY > 10000) {
            return reject({ error: 'Coordenadas fuera de rango' });
        }
        
        const isWindows = process.platform === 'win32';
        
        if (type === 'click') {
            const cmd = isWindows 
                ? `powershell -command "[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${numX},${numY}); [System.Windows.Forms.MouseEvents]::LeftClick.Invoke()`
                : `xdotool mousemove ${numX} ${numY} click 1`;
            
            exec(cmd, (error) => {
                if (error) reject({ error: error.message });
                else resolve({ success: true, action: `click at ${numX},${numY}` });
            });
        } else if (type === 'move') {
            const cmd = isWindows
                ? `powershell -command "[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${numX},${numY})"`
                : `xdotool mousemove ${numX} ${numY}`;
            
            exec(cmd, (error) => {
                if (error) reject({ error: error.message });
                else resolve({ success: true, action: `moved to ${numX},${numY}` });
            });
        } else {
            reject({ error: 'Acción no válida. Usa: click o move' });
        }
    });
}

/**
 * Escritura de teclado
 */
function keyboardType(text) {
    return new Promise((resolve, reject) => {
        // Validar longitud
        if (!text || text.length > MAX_TEXT_LENGTH) {
            return reject({ error: `Texto demasiado largo (máx ${MAX_TEXT_LENGTH})` });
        }
        
        // Verificar inyección
        const safetyCheck = isCommandSafe(text);
        if (!safetyCheck.safe) {
            return reject({ error: `Texto bloqueado: ${safetyCheck.reason}` });
        }
        
        const isWindows = process.platform === 'win32';
        
        // Escapar comillas y caracteres especiales
        const escapedText = text.replace(/'/g, "''");
        
        const cmd = isWindows
            ? `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}')"`
            : `xdotool type '${escapedText}'`;
        
        exec(cmd, (error) => {
            if (error) reject({ error: error.message });
            else resolve({ success: true, action: `typed: ${text}` });
        });
    });
}

module.exports = {
    executeShellCommand,
    mouseAction,
    keyboardType,
    sanitizeCommand,
    isCommandSafe,
    isCommandAllowed
};

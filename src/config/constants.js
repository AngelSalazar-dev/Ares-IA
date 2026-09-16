/**
 * Shared Constants
 * Constantes compartidas en toda la aplicación
 */

// Comandos permitidos del sistema
const ALLOWED_COMMANDS = [
    'code', 'npm', 'node', 'git', 'docker', 'python', 'pip',
    'cd', 'dir', 'ls', 'type', 'mkdir', 'del', 'rm', 'cp', 'mv',
    'curl', 'wget', 'ping', 'ipconfig', 'tasklist', 'taskkill',
    'start', 'explorer', 'notepad', 'cmd', 'powershell',
    'calc', 'spotify', 'chrome', 'msedge', 'firefox', 'control',
    'taskmgr', 'write', 'mspaint', 'sndvol'
];

// Comandos permitidos para Telegram (más restrictivo)
const TELEGRAM_ALLOWED_COMMANDS = [
    'npm', 'node', 'npx', 'git', 'python', 'pip', 'code', 'notepad',
    'calc', 'explorer', 'cmd', 'powershell', 'docker', 'start'
];

// Mapa de aplicaciones para Telegram
const APP_MAP = {
    'spotify': 'start spotify',
    'chrome': 'start chrome',
    'firefox': 'start firefox',
    'edge': 'start msedge',
    'calculadora': 'calc',
    'bloc de notas': 'notepad',
    'discord': 'start discord',
    'whatsapp': 'start whatsapp',
    'youtube': 'start https://youtube.com',
    'telegram': 'start telegram'
};

// Configuración de providers
const PROVIDER_CONFIG = {
    COOLDOWN_MS: 60_000,
    MAX_FAILS: 2,
    GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free'
};

// Límites de seguridad
const SECURITY_LIMITS = {
    MAX_COMMAND_LENGTH: 500,
    MAX_TEXT_LENGTH: 100,
    COMMAND_TIMEOUT: 30000,
    TELEGRAM_TIMEOUT: 10000
};

module.exports = {
    ALLOWED_COMMANDS,
    TELEGRAM_ALLOWED_COMMANDS,
    APP_MAP,
    PROVIDER_CONFIG,
    SECURITY_LIMITS
};

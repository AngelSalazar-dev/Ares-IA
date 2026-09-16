/**
 * Telegram Gateway para ARES
 * Usa los mismos providers que el servidor principal
 * Guarda conversaciones en la base de datos
 */

require('dotenv').config();

const { TELEGRAM_ALLOWED_COMMANDS, APP_MAP, SECURITY_LIMITS } = require('../src/config/constants');
const { getAIResponse } = require('../src/config/providers');
const db = require('../database');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

function extractCommand(message) {
    const patterns = [
        /^(ejecuta|abrir|abre|corre|inicia)\s+(.+)$/i,
        /^(pon|poner)\s+(.+)$/i,
        /^(abre)\s+(.+)$/i,
    ];
    
    for (const p of patterns) {
        const match = message.match(p);
        if (match) {
            const name = match[2].toLowerCase().trim();
            
            for (const [key, cmd] of Object.entries(APP_MAP)) {
                if (name.includes(key) || key.includes(name)) {
                    return cmd;
                }
            }
            
            if (name.length > 2) {
                return `start "" "${name}"`;
            }
        }
    }
    return null;
}

function isCommandSafe(cmd) {
    const first = cmd.split(' ')[0].toLowerCase();
    if (first === 'start') return true;
    return TELEGRAM_ALLOWED_COMMANDS.some(a => first === a);
}

async function sendMessage(chatId, text) {
    await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
}

async function processMessage(chatId, text) {
    const { exec } = require('child_process');
    
    // Obtener o crear sesión para este chat de Telegram
    const sessionId = `telegram_${chatId}`;
    await db.crearChat(sessionId, `Telegram ${chatId}`, 'telegram', chatId.toString());
    
    // Guardar mensaje del usuario
    await db.guardarMensaje(sessionId, text, 'user', 'telegram');
    
    let response;
    
    const cmd = extractCommand(text);
    if (cmd && isCommandSafe(cmd)) {
        response = await new Promise((resolve) => {
            exec(cmd, { timeout: SECURITY_LIMITS.TELEGRAM_TIMEOUT }, (error, stdout, stderr) => {
                const result = error 
                    ? `❌ Error: ${error.message}` 
                    : `✅ **Ejecutado:** ${cmd}\n\n${stdout || 'Completado'}`;
                resolve(result);
            });
        });
    } else {
        const systemPrompt = `Eres ARES, asistente de IA en español. Responde de forma útil y concisa.`;
        
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ];
        
        response = await getAIResponse(messages);
    }
    
    // Guardar respuesta de Ares
    await db.guardarMensaje(sessionId, response, 'ares', 'telegram');
    
    // Actualizar chat
    await db.actualizarChat(sessionId, text);
    
    return response;
}

async function startBot() {
    console.log('[Telegram] Iniciando gateway...');
    
    let offset = 0;
    
    while (true) {
        try {
            const response = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=60`);
            const data = await response.json();
            
            if (data.ok && data.result) {
                for (const update of data.result) {
                    offset = update.update_id + 1;
                    
                    if (update.message) {
                        const chatId = update.message.chat.id;
                        const text = update.message.text;
                        
                        console.log(`[Telegram] Mensaje: ${text}`);
                        
                        await fetch(`${API_URL}/sendChatAction`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, action: 'typing' })
                        });
                        
                        const response = await processMessage(chatId, text);
                        await sendMessage(chatId, response);
                    }
                }
            }
        } catch (e) {
            console.error('[Telegram Error]', e.message);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

module.exports = { startBot, processMessage };

if (require.main === module) {
    startBot();
}

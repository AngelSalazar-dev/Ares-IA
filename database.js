const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const TIDB_CONFIG = {
    host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.DB_PORT || '4000'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test',
    ssl: { rejectUnauthorized: true }
};

const LOCAL_DB_PATH = path.join(__dirname, 'data', 'ares.db');

let sqlDb = null;
let mysqlPool = null;
let isOnline = false;
let syncInterval = null;
let connectionCheckInterval = null;
let saveTimeout = null;
let hasUnsavedChanges = false;

// Debounced save - evita escribir en disco en cada operación
function scheduleSave() {
    hasUnsavedChanges = true;
    if (saveTimeout) return; // Ya hay un save programado
    
    saveTimeout = setTimeout(() => {
        if (hasUnsavedChanges) {
            saveLocalDatabase();
            hasUnsavedChanges = false;
        }
        saveTimeout = null;
    }, 5000); // Guarda como máximo una vez cada 5 segundos
}

async function initLocalDatabase() {
    const SQL = await initSqlJs();
    
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (fs.existsSync(LOCAL_DB_PATH)) {
        const fileBuffer = fs.readFileSync(LOCAL_DB_PATH);
        sqlDb = new SQL.Database(fileBuffer);
        console.log("[DB] Base de datos local cargada");
    } else {
        sqlDb = new SQL.Database();
        console.log("[DB] Nueva base de datos local creada");
    }
    
    sqlDb.run(`
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            titulo TEXT,
            ultimo_mensaje TEXT,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
            sync INTEGER DEFAULT 0,
            fuente TEXT DEFAULT 'web',
            telegram_chat_id TEXT
        )
    `);
    
    sqlDb.run(`
        CREATE TABLE IF NOT EXISTS conversaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            tipo TEXT NOT NULL,
            fecha TEXT DEFAULT CURRENT_TIMESTAMP,
            sync INTEGER DEFAULT 0,
            fuente TEXT DEFAULT 'web'
        )
    `);
    
    saveLocalDatabase();
    console.log("[DB] Tablas locales verificadas/creadas");
}

function saveLocalDatabase() {
    if (!sqlDb) return;
    try {
        const data = sqlDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(LOCAL_DB_PATH, buffer);
    } catch (e) {
        console.error("[DB] Error guardando base de datos:", e.message);
    }
}

// Guardado inmediato (para usar al cerrar)
function forceSaveNow() {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
    if (hasUnsavedChanges) {
        saveLocalDatabase();
        hasUnsavedChanges = false;
    }
}

function getLocalPool() {
    if (!sqlDb) return null;
    return {
        query: (sql, params) => {
            try {
                const stmt = sqlDb.prepare(sql);
                if (params) stmt.bind(params);
                const results = [];
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                return [results];
            } catch (e) {
                console.error("[DB Local] Error query:", e.message);
                return [[]];
            }
        },
        run: (sql, params) => {
            try {
                sqlDb.run(sql, params);
                scheduleSave(); // Debounced save
                return [{}];
            } catch (e) {
                console.error("[DB Local] Error run:", e.message);
                return [{}];
            }
        }
    };
}

async function getMysqlPool() {
    if (!mysqlPool) {
        mysqlPool = mysql.createPool(TIDB_CONFIG);
    }
    return mysqlPool;
}

let lastConnectionState = null;

async function testConnection(silent = true) {
    try {
        const pool = await getMysqlPool();
        await pool.query('SELECT 1');
        
        if (lastConnectionState !== true) {
            isOnline = true;
            lastConnectionState = true;
            if (!silent) console.log("[DB] ✅ Conexión a TiDB establecida");
        }
        return true;
    } catch (error) {
        if (lastConnectionState !== false) {
            isOnline = false;
            lastConnectionState = false;
            if (!silent) console.log("[DB] ⏳ Sin conexión a TiDB, usando base de datos local");
        }
        return false;
    }
}

async function initDatabase() {
    await initLocalDatabase();
    await testConnection();
    startSync();
}

function startSync() {
    syncInterval = setInterval(async () => {
        await syncToCloud();
    }, 30000);
    
    connectionCheckInterval = setInterval(async () => {
        const wasOnline = isOnline;
        await testConnection();
        if (!wasOnline && isOnline) {
            console.log("[DB] Internet恢复 - Iniciando sincronización");
            await syncToCloud();
        }
    }, 10000);
    
    // Cleanup al cerrar el proceso
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
}

function cleanup() {
    console.log("[DB] Cerrando conexiones...");
    forceSaveNow(); // Guardar cambios pendientes
    
    if (syncInterval) clearInterval(syncInterval);
    if (connectionCheckInterval) clearInterval(connectionCheckInterval);
    if (saveTimeout) clearTimeout(saveTimeout);
    
    if (mysqlPool) {
        mysqlPool.end().catch(() => {});
    }
}

async function syncToCloud() {
    if (!isOnline) return;
    
    try {
        const pool = await getMysqlPool();
        
        const local = getLocalPool();
        
        const [chats] = local.query("SELECT * FROM chats WHERE sync = 0");
        for (const chat of chats) {
            try {
                await pool.query(
                    `INSERT INTO chats (session_id, titulo, ultimo_mensaje, fecha_creacion, fecha_actualizacion) 
                     VALUES (?, ?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), ultimo_mensaje = VALUES(ultimo_mensaje), fecha_actualizacion = VALUES(fecha_actualizacion)`,
                    [chat.session_id, chat.titulo, chat.ultimo_mensaje, chat.fecha_creacion, chat.fecha_actualizacion]
                );
                local.run("UPDATE chats SET sync = 1 WHERE id = ?", [chat.id]);
            } catch (e) {
                console.error("[DB] Error sincronizando chat:", e.message);
            }
        }
        
        const [msgs] = local.query("SELECT * FROM conversaciones WHERE sync = 0");
        for (const msg of msgs) {
            try {
                await pool.query(
                    "INSERT INTO conversaciones (session_id, mensaje, tipo, fecha) VALUES (?, ?, ?, ?)",
                    [msg.session_id, msg.mensaje, msg.tipo, msg.fecha]
                );
                local.run("UPDATE conversaciones SET sync = 1 WHERE id = ?", [msg.id]);
            } catch (e) {
                console.error("[DB] Error sincronizando mensaje:", e.message);
            }
        }
        
        if (chats.length > 0 || msgs.length > 0) {
            console.log(`[DB] Sincronizado: ${chats.length} chats, ${msgs.length} mensajes`);
        }
        
    } catch (e) {
        console.error("[DB] Error en sincronización:", e.message);
    }
}

async function guardarMensaje(sessionId, mensaje, tipo, fuente = 'web') {
    const local = getLocalPool();
    const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    local.run(
        "INSERT INTO conversaciones (session_id, mensaje, tipo, fecha, sync, fuente) VALUES (?, ?, ?, ?, 0, ?)",
        [sessionId, mensaje, tipo, fecha, fuente]
    );
    
    await syncToCloud();
    return true;
}

async function obtenerConversacion(sessionId) {
    const local = getLocalPool();
    const [rows] = local.query(
        "SELECT mensaje, tipo, fecha FROM conversaciones WHERE session_id = ? ORDER BY fecha ASC",
        [sessionId]
    );
    return rows;
}

async function limpiarConversacion(sessionId) {
    const local = getLocalPool();
    local.run("DELETE FROM conversaciones WHERE session_id = ?", [sessionId]);
    return true;
}

async function crearChat(sessionId, titulo = 'Nuevo Chat', fuente = 'web', telegramChatId = null) {
    const local = getLocalPool();
    const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    local.run(
        "INSERT OR IGNORE INTO chats (session_id, titulo, fecha_creacion, fecha_actualizacion, sync, fuente, telegram_chat_id) VALUES (?, ?, ?, ?, 0, ?, ?)",
        [sessionId, titulo, fecha, fecha, fuente, telegramChatId]
    );
    
    await syncToCloud();
    return true;
}

async function obtenerHistorialChats() {
    const local = getLocalPool();
    const [rows] = local.query(
        "SELECT session_id, titulo, ultimo_mensaje, fecha_creacion, fecha_actualizacion FROM chats ORDER BY fecha_actualizacion DESC"
    );
    return rows;
}

async function actualizarChat(sessionId, ultimoMensaje) {
    const local = getLocalPool();
    const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    local.run(
        "UPDATE chats SET ultimo_mensaje = ?, fecha_actualizacion = ?, sync = 0 WHERE session_id = ?",
        [ultimoMensaje.substring(0, 50), fecha, sessionId]
    );
    
    await syncToCloud();
    return true;
}

async function renombrarChat(sessionId, titulo) {
    const local = getLocalPool();
    local.run("UPDATE chats SET titulo = ?, sync = 0 WHERE session_id = ?", [titulo, sessionId]);
    await syncToCloud();
    return true;
}

async function eliminarChat(sessionId) {
    const local = getLocalPool();
    local.run("DELETE FROM conversaciones WHERE session_id = ?", [sessionId]);
    local.run("DELETE FROM chats WHERE session_id = ?", [sessionId]);
    await syncToCloud();
    return true;
}

async function obtenerChatsPorFuente(fuente) {
    const local = getLocalPool();
    let query = "SELECT session_id, titulo, ultimo_mensaje, fecha_creacion, fecha_actualizacion, fuente, telegram_chat_id FROM chats";
    
    if (fuente && fuente !== 'all') {
        query += " WHERE fuente = ?";
        const [rows] = local.query(query, [fuente]);
        return rows.sort((a, b) => new Date(b.fecha_actualizacion) - new Date(a.fecha_actualizacion));
    }
    
    const [rows] = local.query(query + " ORDER BY fecha_actualizacion DESC");
    return rows;
}

async function obtenerChatPorTelegramId(telegramChatId) {
    const local = getLocalPool();
    const [rows] = local.query(
        "SELECT session_id FROM chats WHERE telegram_chat_id = ? LIMIT 1",
        [telegramChatId]
    );
    return rows.length > 0 ? rows[0] : null;
}

module.exports = {
    testConnection,
    initDatabase,
    guardarMensaje,
    obtenerConversacion,
    limpiarConversacion,
    crearChat,
    obtenerHistorialChats,
    actualizarChat,
    renombrarChat,
    eliminarChat,
    obtenerChatsPorFuente,
    obtenerChatPorTelegramId
};
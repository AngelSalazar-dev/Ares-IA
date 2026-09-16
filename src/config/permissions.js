/**
 * Permissions System
 * Sistema de permisos por nivel de acceso
 */

// Niveles de permiso
const PERMISSION_LEVELS = {
    public: 0,
    user: 1,
    privileged: 2,
    critical: 3
};

// Permisos por defecto según el nivel
const DEFAULT_PERMISSIONS = {
    [PERMISSION_LEVELS.public]: [],
    [PERMISSION_LEVELS.user]: [
        'ai:chat',
        'info:system',
        'info:network',
        'system:apps',
        'system:volume',
        'system:brightness',
        'files:read',
        'media:screen'
    ],
    [PERMISSION_LEVELS.privileged]: [
        'command:execute',
        'files:write',
        'system:lock',
        'media:camera'
    ],
    [PERMISSION_LEVELS.critical]: [
        'system:shutdown',
        'system:delete',
        'system:format'
    ]
};

// Herramientas que requieren confirmación explícita
const CONFIRMATION_REQUIRED = [
    'execute_command',
    'write_file',
    'system_lock',
    'toggle_camera',
    'send_telegram'
];

// Comandos peligrosos (requieren confirmación adicional)
const DANGEROUS_COMMANDS = [
    'rm', 'rmdir', 'del', 'format', 'shutdown', 'reboot',
    'sudo', 'su', 'chmod', 'chown', 'kill', 'killall',
    'net user', 'net localgroup', 'reg delete',
    'taskkill', 'Stop-Process', 'Remove-Item'
];

class PermissionManager {
    constructor() {
        this.sessions = new Map();
    }

    /**
     * Crea una nueva sesión con permisos
     * @param {string} sessionId - ID de la sesión
     * @param {number} level - Nivel de permiso (0-3)
     * @param {string} apiKey - API Key opcional
     * @returns {Object} - Sesión creada
     */
    createSession(sessionId, level = PERMISSION_LEVELS.user, apiKey = null) {
        const permissions = this._buildPermissions(level);

        const session = {
            id: sessionId,
            level,
            permissions,
            apiKey,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            pendingConfirmations: new Map()
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    /**
     * Verifica si una sesión tiene un permiso específico
     * @param {string} sessionId - ID de la sesión
     * @param {string} permission - Permiso a verificar
     * @returns {boolean}
     */
    hasPermission(sessionId, permission) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.lastActivity = Date.now();
        return session.permissions.includes(permission);
    }

    /**
     * Verifica si una sesión puede ejecutar una herramienta
     * @param {string} sessionId - ID de la sesión
     * @param {string} toolId - ID de la herramienta
     * @returns {Object} - { allowed, requiresConfirmation, reason }
     */
    canExecuteTool(sessionId, toolId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { allowed: false, requiresConfirmation: false, reason: 'Sesión no encontrada' };
        }

        const { getTool } = require('./tools');
        const tool = getTool(toolId);

        if (!tool) {
            return { allowed: false, requiresConfirmation: false, reason: 'Herramienta no encontrada' };
        }

        // Verificar permiso requerido
        if (!session.permissions.includes(tool.requiresPermission)) {
            return {
                allowed: false,
                requiresConfirmation: false,
                reason: `Permiso requerido: ${tool.requiresPermission}`
            };
        }

        // Verificar si requiere confirmación
        const needsConfirmation = CONFIRMATION_REQUIRED.includes(toolId);

        return {
            allowed: true,
            requiresConfirmation: needsConfirmation,
            reason: null
        };
    }

    /**
     * Solicita confirmación para una acción
     * @param {string} sessionId - ID de la sesión
     * @param {string} action - Acción a confirmar
     * @param {Object} details - Detalles de la acción
     * @returns {string} - Token de confirmación
     */
    requestConfirmation(sessionId, action, details) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const token = this._generateToken();
        const confirmation = {
            action,
            details,
            token,
            createdAt: Date.now(),
            expiresAt: Date.now() + 300000 // 5 minutos
        };

        session.pendingConfirmations.set(token, confirmation);
        return token;
    }

    /**
     * Confirma una acción pendiente
     * @param {string} sessionId - ID de la sesión
     * @param {string} token - Token de confirmación
     * @returns {Object} - { confirmed, confirmation }
     */
    confirmAction(sessionId, token) {
        const session = this.sessions.get(sessionId);
        if (!session) return { confirmed: false, confirmation: null };

        const confirmation = session.pendingConfirmations.get(token);
        if (!confirmation) return { confirmed: false, confirmation: null };

        if (Date.now() > confirmation.expiresAt) {
            session.pendingConfirmations.delete(token);
            return { confirmed: false, confirmation: null };
        }

        session.pendingConfirmations.delete(token);
        return { confirmed: true, confirmation };
    }

    /**
     * Verifica si un comando es peligroso
     * @param {string} command - Comando a verificar
     * @returns {boolean}
     */
    isDangerousCommand(command) {
        const lower = command.toLowerCase();
        return DANGEROUS_COMMANDS.some(dc => lower.includes(dc));
    }

    /**
     * Obtiene la información de una sesión
     * @param {string} sessionId - ID de la sesión
     * @returns {Object|null}
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        return {
            id: session.id,
            level: session.level,
            levelName: Object.keys(PERMISSION_LEVELS).find(
                key => PERMISSION_LEVELS[key] === session.level
            ),
            permissions: session.permissions,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            pendingConfirmations: session.pendingConfirmations.size
        };
    }

    /**
     * Elimina una sesión
     * @param {string} sessionId
     */
    destroySession(sessionId) {
        this.sessions.delete(sessionId);
    }

    /**
     * Limpia sesiones expiradas (más de 1 hora sin actividad)
     * @returns {number} - Número de sesiones eliminadas
     */
    cleanupSessions() {
        const now = Date.now();
        const maxAge = 3600000; // 1 hora
        let cleaned = 0;

        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastActivity > maxAge) {
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }

        return cleaned;
    }

    // --- Métodos privados ---

    _buildPermissions(level) {
        const permissions = [];

        for (let i = 0; i <= level; i++) {
            if (DEFAULT_PERMISSIONS[i]) {
                permissions.push(...DEFAULT_PERMISSIONS[i]);
            }
        }

        return [...new Set(permissions)];
    }

    _generateToken() {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    }
}

module.exports = {
    PERMISSION_LEVELS,
    DEFAULT_PERMISSIONS,
    CONFIRMATION_REQUIRED,
    DANGEROUS_COMMANDS,
    PermissionManager
};

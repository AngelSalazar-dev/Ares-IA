/**
 * Reminder Service
 * Servicio de recordatorios y alarmas
 */

const EventEmitter = require('events');

class ReminderService extends EventEmitter {
    constructor() {
        super();
        this.reminders = new Map();
        this.checkInterval = null;
        this.startChecker();
    }

    /**
     * Crea un recordatorio
     * @param {Object} options - Opciones del recordatorio
     * @returns {Object} - Recordatorio creado
     */
    create({ title, message, time, type = 'once', chatId = null, userId = null }) {
        const id = this._generateId();
        const reminder = {
            id,
            title,
            message,
            time: new Date(time),
            type,
            chatId,
            userId,
            active: true,
            createdAt: new Date(),
            triggered: false
        };

        this.reminders.set(id, reminder);
        return reminder;
    }

    /**
     * Crea un recordatorio relativo (en X minutos)
     * @param {number} minutes - Minutos desde ahora
     * @param {string} title - Título del recordatorio
     * @param {string} message - Mensaje del recordatorio
     * @param {Object} options - Opciones adicionales
     * @returns {Object}
     */
    createInMinutes(minutes, title, message, options = {}) {
        const time = new Date(Date.now() + minutes * 60 * 1000);
        return this.create({ title, message, time, ...options });
    }

    /**
     * Crea un recordatorio para una hora específica
     * @param {number} hour - Hora (0-23)
     * @param {number} minute - Minuto (0-59)
     * @param {string} title - Título
     * @param {string} message - Mensaje
     * @param {Object} options - Opciones
     * @returns {Object}
     */
    createAtTime(hour, minute, title, message, options = {}) {
        const now = new Date();
        const time = new Date();
        time.setHours(hour, minute, 0, 0);

        if (time <= now) {
            time.setDate(time.getDate() + 1);
        }

        return this.create({ title, message, time, ...options });
    }

    /**
     * Crea un timer/countdown
     * @param {number} seconds - Segundos del timer
     * @param {string} label - Etiqueta del timer
     * @param {Object} options - Opciones
     * @returns {Object}
     */
    createTimer(seconds, label = 'Timer', options = {}) {
        const time = new Date(Date.now() + seconds * 1000);
        return this.create({
            title: label,
            message: `${label} completado`,
            time,
            type: 'timer',
            ...options
        });
    }

    /**
     * Obtiene un recordatorio por ID
     * @param {string} id - ID del recordatorio
     * @returns {Object|null}
     */
    get(id) {
        return this.reminders.get(id) || null;
    }

    /**
     * Obtiene todos los recordatorios activos
     * @param {string} userId - ID del usuario (opcional)
     * @returns {Array}
     */
    getAll(userId = null) {
        let reminders = Array.from(this.reminders.values());

        if (userId) {
            reminders = reminders.filter(r => r.userId === userId);
        }

        return reminders
            .filter(r => r.active && !r.triggered)
            .sort((a, b) => a.time - b.time);
    }

    /**
     * Obtiene recordatorios próximos (próximas 24 horas)
     * @returns {Array}
     */
    getUpcoming() {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return this.getAll().filter(r => r.time <= tomorrow);
    }

    /**
     * Cancela un recordatorio
     * @param {string} id - ID del recordatorio
     * @returns {boolean}
     */
    cancel(id) {
        const reminder = this.reminders.get(id);
        if (!reminder) return false;

        reminder.active = false;
        return true;
    }

    /**
     * Elimina un recordatorio
     * @param {string} id - ID del recordatorio
     * @returns {boolean}
     */
    delete(id) {
        return this.reminders.delete(id);
    }

    /**
     * Elimina todos los recordatorios de un usuario
     * @param {string} userId - ID del usuario
     * @returns {number} - Número eliminados
     */
    deleteAll(userId) {
        let count = 0;
        for (const [id, reminder] of this.reminders) {
            if (reminder.userId === userId) {
                this.reminders.delete(id);
                count++;
            }
        }
        return count;
    }

    /**
     * Inicia el verificador de recordatorios
     */
    startChecker() {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(() => {
            this._checkReminders();
        }, 1000); // Verificar cada segundo
    }

    /**
     * Detiene el verificador
     */
    stopChecker() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Parsea un string de tiempo a minutos
     * @param {string} timeStr - String de tiempo ("25 min", "1 hora", "30 seg")
     * @returns {number} - Minutos
     */
    parseTimeString(timeStr) {
        if (!timeStr) return 0;

        const lower = timeStr.toLowerCase();

        const minutesMatch = lower.match(/(\d+)\s*(min|minuto|minutos)/);
        if (minutesMatch) return parseInt(minutesMatch[1]);

        const hoursMatch = lower.match(/(\d+)\s*(hora|horas|hr|hrs)/);
        if (hoursMatch) return parseInt(hoursMatch[1]) * 60;

        const secondsMatch = lower.match(/(\d+)\s*(seg|segundo|segundos|sec)/);
        if (secondsMatch) return parseInt(secondsMatch[1]) / 60;

        const numberOnly = lower.match(/^(\d+)$/);
        if (numberOnly) return parseInt(numberOnly[1]);

        return 0;
    }

    /**
     * Formatea segundos a string legible
     * @param {number} seconds - Segundos
     * @returns {string}
     */
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (hrs > 0) parts.push(`${hrs}h`);
        if (mins > 0) parts.push(`${mins}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    // --- Métodos privados ---

    _checkReminders() {
        const now = new Date();

        for (const [id, reminder] of this.reminders) {
            if (reminder.active && !reminder.triggered && reminder.time <= now) {
                reminder.triggered = true;
                this.emit('triggered', reminder);
            }
        }
    }

    _generateId() {
        return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = { ReminderService };

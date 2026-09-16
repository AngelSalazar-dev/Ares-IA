/**
 * Daily Briefing Service
 * Resumen diario matutino y nocturno
 */

class DailyBriefingService {
    constructor(database) {
        this.db = database;
    }

    /**
     * Genera el resumen matutino
     * @param {string} userId - ID del usuario
     * @returns {Object} - Resumen completo
     */
    async getMorningBriefing(userId) {
        const now = new Date();
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const greeting = this._getGreeting(now.getHours());
        const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]}`;

        const tasks = await this._getPendingTasks(userId);
        const notes = await this._getRecentNotes(userId);
        const quote = this._getDailyQuote();

        return {
            greeting,
            date: dateStr,
            tasks: {
                count: tasks.length,
                items: tasks.slice(0, 5)
            },
            notes: {
                count: notes.length,
                items: notes.slice(0, 3)
            },
            quote,
            emoji: '☀️'
        };
    }

    /**
     * Genera el resumen nocturno
     * @param {string} userId - ID del usuario
     * @returns {Object} - Resumen del día
     */
    async getNightSummary(userId) {
        const tasks = await this._getCompletedToday(userId);
        const pending = await this._getPendingTasks(userId);

        return {
            greeting: '🌙 Buenas noches',
            completedTasks: tasks.length,
            pendingTasks: pending.length,
            summary: `Hoy completaste ${tasks.length} tarea(s)`,
            emoji: '🌙'
        };
    }

    /**
     * Formatea el resumen para Telegram
     * @param {Object} briefing - Resumen
     * @returns {string} - Mensaje formateado
     */
    formatForTelegram(briefing) {
        let msg = '';

        if (briefing.greeting) {
            msg += `${briefing.emoji} *${briefing.greeting}*\n`;
        }

        if (briefing.date) {
            msg += `📅 ${briefing.date}\n`;
        }

        if (briefing.tasks) {
            msg += `\n📋 *TAREAS PENDIENTES (${briefing.tasks.count})*\n`;
            for (const task of briefing.tasks.items) {
                msg += `  □ ${task.title}\n`;
            }
        }

        if (briefing.quote) {
            msg += `\n💡 *FRASE DEL DÍA*\n`;
            msg += `"${briefing.quote.text}"\n`;
            msg += `_${briefing.quote.author}_\n`;
        }

        return msg;
    }

    // --- Métodos privados ---

    _getGreeting(hour) {
        if (hour >= 6 && hour < 12) return 'Buenos días';
        if (hour >= 12 && hour < 18) return 'Buenas tardes';
        if (hour >= 18 && hour < 24) return 'Buenas noches';
        return 'Hola';
    }

    async _getPendingTasks(userId) {
        // Placeholder - se integra con la DB
        return [];
    }

    async _getCompletedToday(userId) {
        // Placeholder - se integra con la DB
        return [];
    }

    async _getRecentNotes(userId) {
        // Placeholder - se integra con la DB
        return [];
    }

    _getDailyQuote() {
        const quotes = [
            { text: 'La productividad no es trabajar más, sino mejor.', author: 'Desconocido' },
            { text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
            { text: 'La mejor manera de predecir el futuro es crearlo.', author: 'Peter Drucker' },
            { text: 'No cuentes los días, haz que los días cuenten.', author: 'Muhammad Ali' },
            { text: 'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.', author: 'Desconocido' },
            { text: 'El secreto del avanzar es empezar.', author: 'Mark Twain' },
            { text: 'Hoy es un buen día para empezar algo nuevo.', author: 'Desconocido' }
        ];

        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        return quotes[dayOfYear % quotes.length];
    }
}

module.exports = { DailyBriefingService };

/**
 * Timer Service
 * Gestión de temporizadores y pomodoro
 */

const EventEmitter = require('events');

class TimerService extends EventEmitter {
    constructor() {
        super();
        this.timers = new Map();
        this.checkInterval = null;
        this.startChecker();
    }

    /**
     * Crea un temporizador
     * @param {Object} options - Opciones del timer
     * @returns {Object} - Timer creado
     */
    create({ label = 'Timer', duration, type = 'countdown', chatId = null }) {
        const id = this._generateId();
        const timer = {
            id,
            label,
            duration,
            remaining: duration,
            type,
            chatId,
            running: false,
            paused: false,
            startedAt: null,
            pausedAt: null,
            completedAt: null
        };

        this.timers.set(id, timer);
        return timer;
    }

    /**
     * Crea un pomodoro (25 min trabajo, 5 min descanso)
     * @param {string} label - Etiqueta
     * @param {number} workMinutes - Minutos de trabajo (default 25)
     * @param {number} breakMinutes - Minutos de descanso (default 5)
     * @returns {Object}
     */
    createPomodoro(label = 'Pomodoro', workMinutes = 25, breakMinutes = 5) {
        const id = this._generateId();
        const timer = {
            id,
            label,
            type: 'pomodoro',
            workDuration: workMinutes * 60,
            breakDuration: breakMinutes * 60,
            currentPhase: 'work',
            remaining: workMinutes * 60,
            running: false,
            paused: false,
            startedAt: null,
            pausedAt: null,
            completedPomodoros: 0
        };

        this.timers.set(id, timer);
        return timer;
    }

    /**
     * Inicia un temporizador
     * @param {string} id - ID del timer
     * @returns {Object|null}
     */
    start(id) {
        const timer = this.timers.get(id);
        if (!timer || timer.running) return null;

        timer.running = true;
        timer.paused = false;
        timer.startedAt = new Date();

        return timer;
    }

    /**
     * Pausa un temporizador
     * @param {string} id - ID del timer
     * @returns {Object|null}
     */
    pause(id) {
        const timer = this.timers.get(id);
        if (!timer || !timer.running || timer.paused) return null;

        timer.running = false;
        timer.paused = true;
        timer.pausedAt = new Date();

        return timer;
    }

    /**
     * Reanuda un temporizador
     * @param {string} id - ID del timer
     * @returns {Object|null}
     */
    resume(id) {
        const timer = this.timers.get(id);
        if (!timer || timer.running || !timer.paused) return null;

        timer.running = true;
        timer.paused = false;

        return timer;
    }

    /**
     * Resetea un temporizador
     * @param {string} id - ID del timer
     * @returns {Object|null}
     */
    reset(id) {
        const timer = this.timers.get(id);
        if (!timer) return null;

        if (timer.type === 'pomodoro') {
            timer.remaining = timer.currentPhase === 'work'
                ? timer.workDuration
                : timer.breakDuration;
        } else {
            timer.remaining = timer.duration;
        }

        timer.running = false;
        timer.paused = false;
        timer.startedAt = null;
        timer.pausedAt = null;
        timer.completedAt = null;

        return timer;
    }

    /**
     * Detiene y elimina un temporizador
     * @param {string} id - ID del timer
     * @returns {boolean}
     */
    stop(id) {
        return this.timers.delete(id);
    }

    /**
     * Obtiene un temporizador por ID
     * @param {string} id - ID del timer
     * @returns {Object|null}
     */
    get(id) {
        return this.timers.get(id) || null;
    }

    /**
     * Obtiene todos los timers activos
     * @returns {Array}
     */
    getAll() {
        return Array.from(this.timers.values());
    }

    /**
     * Obtiene timers corriendo
     * @returns {Array}
     */
    getRunning() {
        return this.getAll().filter(t => t.running && !t.paused);
    }

    /**
     * Inicia el verificador de timers
     */
    startChecker() {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(() => {
            this._tick();
        }, 1000);
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
     * Formatea segundos a MM:SS o HH:MM:SS
     * @param {number} seconds - Segundos
     * @returns {string}
     */
    formatTime(seconds) {
        if (seconds < 0) seconds = 0;

        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Formatea timer para mostrar
     * @param {Object} timer - Timer
     * @returns {string}
     */
    formatTimer(timer) {
        let status = '⏹️';
        if (timer.running) status = '▶️';
        else if (timer.paused) status = '⏸️';

        let msg = `${status} *${timer.label}*\n`;
        msg += `⏱️ ${this.formatTime(timer.remaining)}`;

        if (timer.type === 'pomodoro') {
            msg += `\n📊 Pomodoros completados: ${timer.completedPomodoros}`;
            msg += `\n📍 Fase: ${timer.currentPhase === 'work' ? ' trabajo' : '☕ descanso'}`;
        }

        return msg;
    }

    // --- Métodos privados ---

    _tick() {
        for (const [id, timer] of this.timers) {
            if (!timer.running || timer.paused) continue;

            timer.remaining--;

            if (timer.remaining <= 0) {
                timer.running = false;
                timer.completedAt = new Date();

                if (timer.type === 'pomodoro') {
                    this._handlePomodoroComplete(timer);
                }

                this.emit('completed', timer);
            } else {
                this.emit('tick', { timer, remaining: timer.remaining });
            }
        }
    }

    _handlePomodoroComplete(timer) {
        if (timer.currentPhase === 'work') {
            timer.completedPomodoros++;
            timer.currentPhase = 'break';
            timer.remaining = timer.breakDuration;
        } else {
            timer.currentPhase = 'work';
            timer.remaining = timer.workDuration;
        }

        timer.running = false;
        timer.startedAt = null;
    }

    _generateId() {
        return `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = { TimerService };

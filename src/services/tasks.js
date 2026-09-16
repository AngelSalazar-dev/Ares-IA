/**
 * Tasks Service
 * Gestión de tareas y to-do list
 */

class TasksService {
    constructor(database) {
        this.db = database;
        this.tasks = new Map();
    }

    /**
     * Crea una tarea
     * @param {Object} options - Opciones de la tarea
     * @returns {Object} - Tarea creada
     */
    create({ title, description = null, priority = 'medium', dueDate = null, userId = null }) {
        const id = this._generateId();
        const task = {
            id,
            title,
            description,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            userId,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: null
        };

        this.tasks.set(id, task);
        return task;
    }

    /**
     * Obtiene una tarea por ID
     * @param {string} id - ID de la tarea
     * @returns {Object|null}
     */
    get(id) {
        return this.tasks.get(id) || null;
    }

    /**
     * Obtiene todas las tareas de un usuario
     * @param {string} userId - ID del usuario
     * @param {boolean} includeCompleted - Incluir completadas
     * @returns {Array}
     */
    getAll(userId = null, includeCompleted = true) {
        let tasks = Array.from(this.tasks.values());

        if (userId) {
            tasks = tasks.filter(t => t.userId === userId);
        }

        if (!includeCompleted) {
            tasks = tasks.filter(t => !t.completed);
        }

        return this._sortByPriority(tasks);
    }

    /**
     * Obtiene tareas pendientes
     * @param {string} userId - ID del usuario
     * @returns {Array}
     */
    getPending(userId = null) {
        return this.getAll(userId, false);
    }

    /**
     * Obtiene tareas completadas hoy
     * @param {string} userId - ID del usuario
     * @returns {Array}
     */
    getCompletedToday(userId = null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.getAll(userId).filter(t =>
            t.completed && t.completedAt && t.completedAt >= today
        );
    }

    /**
     * Marca una tarea como completada
     * @param {string} id - ID de la tarea
     * @returns {Object|null}
     */
    complete(id) {
        const task = this.tasks.get(id);
        if (!task) return null;

        task.completed = true;
        task.completedAt = new Date();
        task.updatedAt = new Date();
        return task;
    }

    /**
     * Marca una tarea como pendiente
     * @param {string} id - ID de la tarea
     * @returns {Object|null}
     */
    uncomplete(id) {
        const task = this.tasks.get(id);
        if (!task) return null;

        task.completed = false;
        task.completedAt = null;
        task.updatedAt = new Date();
        return task;
    }

    /**
     * Actualiza una tarea
     * @param {string} id - ID de la tarea
     * @param {Object} updates - Campos a actualizar
     * @returns {Object|null}
     */
    update(id, updates) {
        const task = this.tasks.get(id);
        if (!task) return null;

        Object.assign(task, updates, { updatedAt: new Date() });
        return task;
    }

    /**
     * Elimina una tarea
     * @param {string} id - ID de la tarea
     * @returns {boolean}
     */
    delete(id) {
        return this.tasks.delete(id);
    }

    /**
     * Elimina todas las tareas completadas
     * @param {string} userId - ID del usuario
     * @returns {number}
     */
    clearCompleted(userId = null) {
        let count = 0;
        for (const [id, task] of this.tasks) {
            if (task.completed && (!userId || task.userId === userId)) {
                this.tasks.delete(id);
                count++;
            }
        }
        return count;
    }

    /**
     * Obtiene estadísticas de tareas
     * @param {string} userId - ID del usuario
     * @returns {Object}
     */
    getStats(userId = null) {
        const all = this.getAll(userId);
        const pending = all.filter(t => !t.completed);
        const completed = all.filter(t => t.completed);

        const byPriority = {
            high: pending.filter(t => t.priority === 'high').length,
            medium: pending.filter(t => t.priority === 'medium').length,
            low: pending.filter(t => t.priority === 'low').length
        };

        return {
            total: all.length,
            pending: pending.length,
            completed: completed.length,
            byPriority,
            completionRate: all.length > 0
                ? Math.round((completed.length / all.length) * 100)
                : 0
        };
    }

    /**
     * Formatea una tarea para mostrar
     * @param {Object} task - Tarea
     * @returns {string}
     */
    formatTask(task) {
        const priorityEmoji = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };

        const status = task.completed ? '☑️' : '□';
        const priority = priorityEmoji[task.priority] || '🟡';

        let formatted = `${status} ${priority} *${task.title}*`;

        if (task.description) {
            formatted += `\n   ${task.description}`;
        }

        if (task.dueDate) {
            formatted += `\n   📅 ${this._formatDate(task.dueDate)}`;
        }

        return formatted;
    }

    /**
     * Formatea todas las tareas para mostrar
     * @param {Array} tasks - Tareas
     * @param {string} title - Título de la lista
     * @returns {string}
     */
    formatAllTasks(tasks, title = 'TUS TAREAS') {
        const pending = tasks.filter(t => !t.completed);
        const completed = tasks.filter(t => t.completed);

        let msg = `📋 *${title} (${pending.length} pendientes)*\n`;
        msg += '═══════════════════\n\n';

        if (pending.length > 0) {
            msg += '*Pendientes:*\n';
            for (const task of pending) {
                msg += this.formatTask(task) + '\n';
            }
        }

        if (completed.length > 0) {
            msg += '\n*Completadas:*\n';
            for (const task of completed.slice(0, 5)) {
                msg += this.formatTask(task) + '\n';
            }
        }

        if (tasks.length === 0) {
            msg += '🎉 ¡No tienes tareas pendientes!\n';
        }

        return msg;
    }

    // --- Métodos privados ---

    _generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _sortByPriority(tasks) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        });
    }

    _formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    }
}

module.exports = { TasksService };

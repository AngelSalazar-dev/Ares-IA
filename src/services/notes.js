/**
 * Notes Service
 * Gestión de notas rápidas
 */

class NotesService {
    constructor(database) {
        this.db = database;
        this.notes = new Map();
    }

    /**
     * Crea una nota rápida
     * @param {Object} options - Opciones de la nota
     * @returns {Object} - Nota creada
     */
    create({ title, content, tag = null, userId = null }) {
        const id = this._generateId();
        const note = {
            id,
            title: title || 'Sin título',
            content,
            tag,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            pinned: false
        };

        this.notes.set(id, note);
        return note;
    }

    /**
     * Obtiene una nota por ID
     * @param {string} id - ID de la nota
     * @returns {Object|null}
     */
    get(id) {
        return this.notes.get(id) || null;
    }

    /**
     * Obtiene todas las notas de un usuario
     * @param {string} userId - ID del usuario
     * @returns {Array}
     */
    getAll(userId = null) {
        let notes = Array.from(this.notes.values());

        if (userId) {
            notes = notes.filter(n => n.userId === userId);
        }

        return notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.createdAt - a.createdAt;
        });
    }

    /**
     * Obtiene notas por tag
     * @param {string} tag - Tag a buscar
     * @param {string} userId - ID del usuario
     * @returns {Array}
     */
    getByTag(tag, userId = null) {
        return this.getAll(userId).filter(n => n.tag === tag);
    }

    /**
     * Busca notas por contenido
     * @param {string} query - Texto a buscar
     * @param {string} userId - ID del usuario
     * @returns {Array}
     */
    search(query, userId = null) {
        const lower = query.toLowerCase();
        return this.getAll(userId).filter(n =>
            n.title.toLowerCase().includes(lower) ||
            n.content.toLowerCase().includes(lower)
        );
    }

    /**
     * Actualiza una nota
     * @param {string} id - ID de la nota
     * @param {Object} updates - Campos a actualizar
     * @returns {Object|null}
     */
    update(id, updates) {
        const note = this.notes.get(id);
        if (!note) return null;

        Object.assign(note, updates, { updatedAt: new Date() });
        return note;
    }

    /**
     * Fija/desfija una nota
     * @param {string} id - ID de la nota
     * @returns {Object|null}
     */
    togglePin(id) {
        const note = this.notes.get(id);
        if (!note) return null;

        note.pinned = !note.pinned;
        note.updatedAt = new Date();
        return note;
    }

    /**
     * Elimina una nota
     * @param {string} id - ID de la nota
     * @returns {boolean}
     */
    delete(id) {
        return this.notes.delete(id);
    }

    /**
     * Elimina todas las notas de un usuario
     * @param {string} userId - ID del usuario
     * @returns {number}
     */
    deleteAll(userId) {
        let count = 0;
        for (const [id, note] of this.notes) {
            if (note.userId === userId) {
                this.notes.delete(id);
                count++;
            }
        }
        return count;
    }

    /**
     * Obtiene los tags únicos
     * @param {string} userId - ID del usuario
     * @returns {Array}
     */
    getTags(userId = null) {
        const notes = this.getAll(userId);
        const tags = new Set(notes.filter(n => n.tag).map(n => n.tag));
        return Array.from(tags);
    }

    /**
     * Formatea una nota para mostrar
     * @param {Object} note - Nota
     * @returns {string}
     */
    formatNote(note) {
        let formatted = '';

        if (note.pinned) formatted += '📌 ';
        formatted += `📝 *${note.title}*\n`;
        formatted += `${note.content}\n`;

        if (note.tag) {
            formatted += `🏷️ #${note.tag}\n`;
        }

        formatted += `_${this._formatDate(note.createdAt)}_`;

        return formatted;
    }

    /**
     * Formatea todas las notas para mostrar
     * @param {Array} notes - Notas
     * @returns {string}
     */
    formatAllNotes(notes) {
        if (notes.length === 0) {
            return '📝 No tienes notas guardadas.\n\nUsa `/nota [texto]` para crear una.';
        }

        let msg = `📝 *TUS NOTAS (${notes.length})*\n`;
        msg += '═══════════════════\n\n';

        for (const note of notes) {
            msg += this.formatNote(note) + '\n\n';
        }

        return msg;
    }

    // --- Métodos privados ---

    _generateId() {
        return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

module.exports = { NotesService };

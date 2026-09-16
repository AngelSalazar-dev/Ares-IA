/**
 * Lifestyle Routes
 * Endpoints para funcionalidades de estilo de vida
 */

const express = require('express');
const router = express.Router();
const { ReminderService } = require('../services/reminder');
const { DailyBriefingService } = require('../services/dailyBriefing');
const { NotesService } = require('../services/notes');
const { TasksService } = require('../services/tasks');
const { TimerService } = require('../services/timer');
const { detectScript, listScripts } = require('../config/scripts');
const { ModeManager } = require('../config/modes');
const { asyncHandler } = require('../middleware/errorHandler');

// Instancias de servicios
const reminderService = new ReminderService();
const dailyBriefingService = new DailyBriefingService();
const notesService = new NotesService();
const tasksService = new TasksService();
const timerService = new TimerService();
const modeManager = new ModeManager();

// ==================== REMINDERS ====================

// POST /api/lifestyle/reminders - Crear recordatorio
router.post('/reminders', asyncHandler(async (req, res) => {
    const { title, message, time, type, inMinutes, atHour, atMinute } = req.body;
    const userId = req.headers['x-user-id'] || 'default';

    let reminder;

    if (inMinutes) {
        reminder = reminderService.createInMinutes(inMinutes, title, message, { userId });
    } else if (atHour !== undefined && atMinute !== undefined) {
        reminder = reminderService.createAtTime(atHour, atMinute, title, message, { userId });
    } else if (time) {
        reminder = reminderService.create({ title, message, time, type, userId });
    } else {
        return res.status(400).json({ error: 'Falta tiempo del recordatorio' });
    }

    res.json({ success: true, reminder });
}));

// GET /api/lifestyle/reminders - Obtener recordatorios
router.get('/reminders', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default';
    const reminders = reminderService.getAll(userId);
    res.json(reminders);
}));

// DELETE /api/lifestyle/reminders/:id - Cancelar recordatorio
router.delete('/reminders/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cancelled = reminderService.cancel(id);
    res.json({ success: cancelled });
}));

// ==================== NOTES ====================

// POST /api/lifestyle/notes - Crear nota
router.post('/notes', asyncHandler(async (req, res) => {
    const { title, content, tag } = req.body;
    const userId = req.headers['x-user-id'] || 'default';

    if (!content) {
        return res.status(400).json({ error: 'Contenido requerido' });
    }

    const note = notesService.create({ title, content, tag, userId });
    res.json({ success: true, note });
}));

// GET /api/lifestyle/notes - Obtener notas
router.get('/notes', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default';
    const notes = notesService.getAll(userId);
    res.json(notes);
}));

// GET /api/lifestyle/notes/search/:query - Buscar notas
router.get('/notes/search/:query', asyncHandler(async (req, res) => {
    const { query } = req.params;
    const userId = req.headers['x-user-id'] || 'default';
    const notes = notesService.search(query, userId);
    res.json(notes);
}));

// DELETE /api/lifestyle/notes/:id - Eliminar nota
router.delete('/notes/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = notesService.delete(id);
    res.json({ success: deleted });
}));

// ==================== TASKS ====================

// POST /api/lifestyle/tasks - Crear tarea
router.post('/tasks', asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    const userId = req.headers['x-user-id'] || 'default';

    if (!title) {
        return res.status(400).json({ error: 'Título requerido' });
    }

    const task = tasksService.create({ title, description, priority, dueDate, userId });
    res.json({ success: true, task });
}));

// GET /api/lifestyle/tasks - Obtener tareas
router.get('/tasks', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default';
    const { includeCompleted } = req.query;
    const tasks = tasksService.getAll(userId, includeCompleted !== 'false');
    res.json(tasks);
}));

// PUT /api/lifestyle/tasks/:id/complete - Completar tarea
router.put('/tasks/:id/complete', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const task = tasksService.complete(id);
    res.json({ success: !!task, task });
}));

// PUT /api/lifestyle/tasks/:id/uncomplete - Descompletar tarea
router.put('/tasks/:id/uncomplete', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const task = tasksService.uncomplete(id);
    res.json({ success: !!task, task });
}));

// DELETE /api/lifestyle/tasks/:id - Eliminar tarea
router.delete('/tasks/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = tasksService.delete(id);
    res.json({ success: deleted });
}));

// GET /api/lifestyle/tasks/stats - Estadísticas de tareas
router.get('/tasks/stats', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default';
    const stats = tasksService.getStats(userId);
    res.json(stats);
}));

// ==================== TIMERS ====================

// POST /api/lifestyle/timers - Crear timer
router.post('/timers', asyncHandler(async (req, res) => {
    const { label, duration, type, pomodoro, workMinutes, breakMinutes } = req.body;

    let timer;

    if (pomodoro) {
        timer = timerService.createPomodoro(label, workMinutes, breakMinutes);
    } else {
        timer = timerService.create({ label, duration, type });
    }

    res.json({ success: true, timer });
}));

// POST /api/lifestyle/timers/:id/start - Iniciar timer
router.post('/timers/:id/start', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const timer = timerService.start(id);
    res.json({ success: !!timer, timer });
}));

// POST /api/lifestyle/timers/:id/pause - Pausar timer
router.post('/timers/:id/pause', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const timer = timerService.pause(id);
    res.json({ success: !!timer, timer });
}));

// POST /api/lifestyle/timers/:id/resume - Reanudar timer
router.post('/timers/:id/resume', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const timer = timerService.resume(id);
    res.json({ success: !!timer, timer });
}));

// POST /api/lifestyle/timers/:id/reset - Resetear timer
router.post('/timers/:id/reset', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const timer = timerService.reset(id);
    res.json({ success: !!timer, timer });
}));

// DELETE /api/lifestyle/timers/:id - Detener timer
router.delete('/timers/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const stopped = timerService.stop(id);
    res.json({ success: stopped });
}));

// GET /api/lifestyle/timers - Obtener timers activos
router.get('/timers', asyncHandler(async (req, res) => {
    const timers = timerService.getAll();
    res.json(timers);
}));

// ==================== MODES ====================

// GET /api/lifestyle/modes - Obtener modos disponibles
router.get('/modes', asyncHandler(async (req, res) => {
    const modes = modeManager.listModes();
    res.json(modes);
}));

// POST /api/lifestyle/modes - Cambiar modo
router.post('/modes', asyncHandler(async (req, res) => {
    const { mode } = req.body;
    const newMode = modeManager.setMode(mode);
    res.json({ success: !!newMode, mode: newMode });
}));

// GET /api/lifestyle/modes/current - Obtener modo actual
router.get('/modes/current', asyncHandler(async (req, res) => {
    const mode = modeManager.getMode();
    res.json(mode);
}));

// ==================== SCRIPTS ====================

// GET /api/lifestyle/scripts - Listar scripts disponibles
router.get('/scripts', asyncHandler(async (req, res) => {
    const scripts = listScripts();
    res.json(scripts);
}));

// POST /api/lifestyle/scripts/detect - Detectar script en mensaje
router.post('/scripts/detect', asyncHandler(async (req, res) => {
    const { message } = req.body;
    const script = detectScript(message);
    res.json({ script });
}));

// ==================== BRIEFING ====================

// GET /api/lifestyle/briefing/morning - Resumen matutino
router.get('/briefing/morning', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default';
    const briefing = await dailyBriefingService.getMorningBriefing(userId);
    res.json(briefing);
}));

// GET /api/lifestyle/briefing/night - Resumen nocturno
router.get('/briefing/night', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default';
    const summary = await dailyBriefingService.getNightSummary(userId);
    res.json(summary);
}));

// ==================== COMANDOS RÁPIDOS ====================

// POST /api/lifestyle/quick - Procesar comando rápido
router.post('/quick', asyncHandler(async (req, res) => {
    const { command, args } = req.body;
    const userId = req.headers['x-user-id'] || 'default';

    let response;

    switch (command) {
        case 'nota':
            const note = notesService.create({ content: args, userId });
            response = { type: 'note', message: `✅ Nota guardada: "${args}"`, data: note };
            break;

        case 'tarea':
            const task = tasksService.create({ title: args, userId });
            response = { type: 'task', message: `✅ Tarea creada: "${args}"`, data: task };
            break;

        case 'timer':
            const minutes = timerService.formatTime(parseInt(args) * 60 || 1500);
            const timer = timerService.create({ label: 'Timer rápido', duration: parseInt(args) * 60 || 1500 });
            response = { type: 'timer', message: `⏱️ Timer iniciado: ${minutes}`, data: timer };
            break;

        case 'pomodoro':
            const pomo = timerService.createPomodoro();
            response = { type: 'pomodoro', message: '🍅 Pomodoro iniciado: 25 min trabajo, 5 min descanso', data: pomo };
            break;

        default:
            response = { type: 'error', message: 'Comando no reconocido' };
    }

    res.json(response);
}));

// Exportar servicios para usar en otros módulos
module.exports = router;
module.exports.services = {
    reminderService,
    notesService,
    tasksService,
    timerService,
    modeManager
};

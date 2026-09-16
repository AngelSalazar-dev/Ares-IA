/**
 * Scripts Predefinidos
 * Acciones automáticas que Ares puede ejecutar
 */

const scripts = [
    {
        id: 'morning',
        name: 'Buenos Días',
        description: 'Resumen matutino con clima, tareas y eventos',
        triggers: ['buenos días', 'buenos dias', 'buen día', 'buen dia', 'morning', 'días'],
        timeWindow: { start: 6, end: 12 },
        action: 'dailyBriefing',
        icon: '☀️'
    },
    {
        id: 'night',
        name: 'Buenas Noches',
        description: 'Resumen nocturno del día',
        triggers: ['buenas noches', 'buenas noces', 'noches', 'night', 'dormir'],
        timeWindow: { start: 20, end: 24 },
        action: 'nightSummary',
        icon: '🌙'
    },
    {
        id: 'pomodoro',
        name: 'Pomodoro',
        description: 'Timer de enfoque 25 minutos',
        triggers: ['pomodoro', 'enfoque', 'concentración', 'concentracion', 'focus', 'trabajar'],
        action: 'startPomodoro',
        icon: '🍅'
    },
    {
        id: 'break',
        name: 'Descanso',
        description: 'Timer de descanso 5 minutos',
        triggers: ['descanso', 'break', 'pausa', 'parar'],
        action: 'startBreak',
        icon: '☕'
    },
    {
        id: 'meeting',
        name: 'Reunión',
        description: 'Silenciar y timer de duración',
        triggers: ['reunión', 'reunion', 'meeting', 'call', 'videollamada'],
        action: 'startMeeting',
        icon: '📞'
    },
    {
        id: 'spotify',
        name: 'Música',
        description: 'Abrir Spotify y reproducir',
        triggers: ['música', 'musica', 'spotify', 'canción', 'cancion', 'pon', 'escuchar'],
        action: 'openSpotify',
        icon: '🎵'
    },
    {
        id: 'focus',
        name: 'Modo Enfoque',
        description: 'Cerrar distracciones, silenciar notificaciones',
        triggers: ['concentra', 'enfócate', 'enfocate', 'sin distracciones', 'modo trabajo'],
        action: 'startFocus',
        icon: '🎯'
    },
    {
        id: 'work',
        name: 'Modo Trabajo',
        description: 'Respuestas directas, menos emojis',
        triggers: ['modo trabajo', 'trabajo', 'profesional', 'formal'],
        action: 'setWorkMode',
        icon: '💼'
    },
    {
        id: 'relax',
        name: 'Modo Relax',
        description: 'Conversación relajada, música suave',
        triggers: ['relax', 'descansa', 'tranquilo', 'moda relajado', 'moda casual'],
        action: 'setRelaxMode',
        icon: '😎'
    },
    {
        id: 'learn',
        name: 'Modo Aprendizaje',
        description: 'Explicaciones detalladas y educativas',
        triggers: ['aprende', 'enseña', 'explica', 'qué es', 'cómo funciona', 'tutorial'],
        action: 'setLearnMode',
        icon: '📚'
    },
    {
        id: 'creative',
        name: 'Modo Creativo',
        description: 'Ideas, brainstorming, creatividad',
        triggers: ['crea', 'diseña', 'idea', 'brainstorm', 'creatividad', 'inspira'],
        action: 'setCreativeMode',
        icon: '🎨'
    },
    {
        id: 'code',
        name: 'Modo Código',
        description: 'Ayuda técnica con programación',
        triggers: ['código', 'codigo', 'programa', 'función', 'funcion', 'error', 'bug', 'debug'],
        action: 'setCodeMode',
        icon: '💻'
    },
    {
        id: 'system',
        name: 'Control Sistema',
        description: 'Abrir apps, ejecutar comandos del sistema',
        triggers: ['sistema', 'pc', 'computadora', 'abre', 'ejecuta', 'abrir', 'ejecutar'],
        action: 'systemControl',
        icon: '🖥️'
    },
    {
        id: 'timer',
        name: 'Temporizador',
        description: 'Establecer un timer personalizado',
        triggers: ['timer', 'temporizador', 'cuenta regresiva', 'alarm', 'alarma'],
        action: 'setTimer',
        icon: '⏰'
    },
    {
        id: 'note',
        name: 'Nota Rápida',
        description: 'Guardar una nota rápida',
        triggers: ['nota', 'apunta', 'recuerda', 'anota', 'guarda'],
        action: 'saveNote',
        icon: '📝'
    },
    {
        id: 'task',
        name: 'Tarea',
        description: 'Agregar tarea a la lista',
        triggers: ['tarea', 'pendiente', 'hacer', 'completar', 'to-do'],
        action: 'addTask',
        icon: '📋'
    },
    {
        id: 'joke',
        name: 'Chiste',
        description: 'Contar un chiste aleatorio',
        triggers: ['chiste', 'broma', 'diviérteme', 'divierteme', 'reír', 'reir'],
        action: 'tellJoke',
        icon: '😄'
    },
    {
        id: 'quote',
        name: 'Frase Motivacional',
        description: 'Frase del día para motivar',
        triggers: ['frase', 'motiva', 'inspira', 'cita', 'quote'],
        action: 'getQuote',
        icon: '💡'
    },
    {
        id: 'weather',
        name: 'Clima',
        description: 'Información del clima actual',
        triggers: ['clima', 'tiempo', 'weather', 'temperatura', 'lluvia', 'sol'],
        action: 'getWeather',
        icon: '🌤️'
    },
    {
        id: 'help',
        name: 'Ayuda',
        description: 'Mostrar lista de comandos disponibles',
        triggers: ['ayuda', 'help', 'comandos', 'opciones', 'qué puedes'],
        action: 'showHelp',
        icon: '❓'
    }
];

/**
 * Detecta qué script se debe ejecutar
 * @param {string} message - Mensaje del usuario
 * @returns {Object|null} - Script detectado o null
 */
function detectScript(message) {
    if (!message || typeof message !== 'string') return null;

    const lower = message.toLowerCase().trim();

    for (const script of scripts) {
        for (const trigger of script.triggers) {
            if (lower.includes(trigger)) {
                return script;
            }
        }
    }

    return null;
}

/**
 * Verifica si el mensaje coincide con un script por hora
 * @param {Object} script - Script a verificar
 * @returns {boolean}
 */
function isWithinTimeWindow(script) {
    if (!script.timeWindow) return true;

    const hour = new Date().getHours();
    const { start, end } = script.timeWindow;

    if (start < end) {
        return hour >= start && hour < end;
    } else {
        return hour >= start || hour < end;
    }
}

/**
 * Obtiene todos los scripts disponibles
 * @returns {Array}
 */
function listScripts() {
    return scripts.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        triggers: s.triggers.slice(0, 3)
    }));
}

/**
 * Obtiene un script por ID
 * @param {string} id - ID del script
 * @returns {Object|null}
 */
function getScript(id) {
    return scripts.find(s => s.id === id) || null;
}

module.exports = {
    scripts,
    detectScript,
    isWithinTimeWindow,
    listScripts,
    getScript
};

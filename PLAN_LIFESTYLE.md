# Plan: Ares - Estilo TRON + Lifestyle + Ergonomía + Contexto + Overlay/Live

## 🎨 IDENTIDAD VISUAL: TRON

### Paleta de Colores
```
FONDO:        #0a0a0f  (Negro profundo)
SUPERFICIE:   #12121a  (Gris oscuro)
SECUNDARIO:   #1a1a2e  (Azul muy oscuro)

PRIMARIO:     #ff1133  (Rojo neón Ares)
GLOW:         #ff113380 (Rojo con transparencia)
BRILLANTE:    #ff3355  (Rojo claro)

TEXTO:        #ffffff  (Blanco puro)
TEXTO DIM:    #666680  (Gris apagado)
ACCENT:       #00ffff  (Cyan - acento secundario TRON)
```

### Efectos
| Efecto | CSS |
|--------|-----|
| **Glow** | `box-shadow: 0 0 20px #ff1133, 0 0 40px #ff113340` |
| **Text glow** | `text-shadow: 0 0 10px #ff1133` |
| **Border glow** | `border: 1px solid #ff113340` |
| **Scan line** | Línea horizontal animada |
| **Grid** | Fondo tipo rejilla sutil |
| **Pulse** | Animación de pulso |

---

## 🧠 CONTEXTO INTELIGENTE

### 1. Detección de Intención Mejorada

| Palabras Clave | Acción | Ejemplo |
|----------------|--------|---------|
| **abre/app** | Abrir aplicación | "abre Chrome" → ejecutar |
| **ejecuta/corre** | Ejecutar comando | "ejecuta notepad" |
| **pon/poner** | Acción | "pon música" → Spotify |
| **busca/investiga** | Web search | "busca recetas" |
| **recuerda/avísame** | Reminder | "avísame a las 3" |
| **nota/apunta** | Guardar nota | "apunta: comprar leche" |
| **tarea/pendiente** | To-do | "agrega tarea: informe" |
| **timer/temporizador** | Timer | "timer 25 min" |
| **clima/weather** | Info clima | "¿cómo está el clima?" |
| **hora/time** | Hora actual | "¿qué hora es?" |
| **chiste/broma** | Entretenimiento | "cuéntame un chiste" |
| **frase/motiva** | Motivación | "dame una frase" |
| **ayuda/help** | Comandos | "¿qué puedes hacer?" |

### 2. Contexto Situacional

| Situación | Detección | Acción de Ares |
|-----------|-----------|----------------|
| **Mañana** (6-12h) | Hora del día | "Buenos días" + resumen |
| **Tarde** (12-18h) | Hora del día | "Buenas tardes" |
| **Noche** (18-24h) | Hora del día | "Buenas noches" + resumen |
| **Lunes** | Día de la semana | "Inicio de semana, ¿qué planeas?" |
| **Viernes** | Día de la semana | "¡Viernes! ¿Algo especial?" |
| **Sin actividad** | Tiempo sin usar | "¡Hola! ¿Cómo vas?" |
| **Muchos errores** | Errores seguidos | "¿Necesitas ayuda?" |
| **Sesión larga** | >1 hora activo | "¿Quieres un descanso?" |

### 3. Agentes Automáticos

| Agente | Trigger | Acción |
|--------|---------|--------|
| **work** | "trabajo", "enfoque", "concentra" | Modo trabajo, menos distracciones |
| **relax** | "relax", "descansa", "música" | Modo relajación |
| **learn** | "aprende", "enseña", "explica" | Explicaciones detalladas |
| **code** | "código", "función", "error" | Ayuda técnica |
| **creative** | "crea", "diseña", "idea" | Modo creativo |
| **system** | "sistema", "PC", "computadora" | Control del sistema |

### 4. Scripts Predefinidos

| Script | Trigger | Acción |
|--------|---------|--------|
| **morning** | "buenos días", hora matutina | Resumen diario |
| **pomodoro** | "pomodoro", "enfoque" | Timer 25min + silenciar |
| **meeting** | "reunión", "meeting" | Silenciar + timer duración |
| **break** | "descanso", "break" | Timer 5min + recordatorio |
| **night** | "buenas noches", >22h | Resumen nocturno |
| **spotify** | "música", "canción", "pon" | Abrir Spotify |
| **focus** | "concentra", "enfoque" | Cerrar distracciones |

---

## 🎨 DISEÑO ERGONÓMICO

### Layout Principal
```
╔═══════════════════════════════════════════════════════════════╗
║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ARES SYSTEM ▓▓▓▓▓▓▓▓▓▓▓▓   [🌐][⚙️][≡]   ║
╠═══════════════════╦═══════════════════════════════════════════╣
║                   ║                                           ║
║  📅 HOY           ║  💬 CONVERSA                              ║
║  ─────────────    ║  ─────────────────────────────────────── ║
║  Martes 16        ║                                           ║
║  🌡️ 22°C Soleado  ║  [Mensajes de chat...]                   ║
║  📅 3 eventos     ║                                           ║
║                   ║                                           ║
╠═══════════════════╣                                           ║
║                   ║                                           ║
║  ⚡ ACCIONES      ║                                           ║
║  ─────────────    ║                                           ║
║  [📝][⏰][📋][🎵] ║                                           ║
║                   ║                                           ║
╠═══════════════════╣  ┌─────────────────────────────────────┐ ║
║                   ║  │ > INPUT_                            │ ║
║  📋 TAREAS (3)    ║  │ Escribe un mensaje...           🎤🔊│ ║
║  ─────────────    ║  └─────────────────────────────────────┘ ║
║  □ Comprar leche  ║                                           ║
║  □ Terminar info  ║  ┌─────────────────────────────────────┐ ║
║  ☑ Llamar doctor ║  │ > TERMINAL LOG              [▼] [✕] │ ║
║                   ║  │ [SYS] Ares initialized...           │ ║
╠═══════════════════╣  └─────────────────────────────────────┘ ║
║                   ║                                           ║
║  💡 TIP DEL DÍA   ║                                           ║
║  ─────────────    ║                                           ║
║  "La productivi-  ║                                           ║
║   dad es..."      ║                                           ║
║                   ║                                           ║
╚═══════════════════╩═══════════════════════════════════════════╝
```

### Sidebar Colapsable
```
┌──────────────┐     ┌──────┐
│ ▣ ARES  [≡]  │ ──► │ ▣    │  ← Solo iconos
│──────────────│     │──────│
│ 🔍 Buscar... │     │ 🔍   │
│──────────────│     │──────│
│ 📱 Todos  ▾  │     │ 📱   │
│──────────────│     │──────│
│ 💬 Chat 1    │     │ 💬   │
│    📱 TG     │     │──────│
│──────────────│     │ 💬   │
│ 💬 Chat 2    │     │──────│
│    💻 Web    │     │      │
│──────────────│     │──────│
│ [+] Nuevo    │     │ [+]  │
│──────────────│     │──────│
│ ⚙️ Config    │     │ ⚙️   │
└──────────────┘     └──────┘
```

### Terminal Log (Colapsable)
```
┌─────────────────────────────────────────────┐
│ ▸ TERMINAL LOG                      [▼] [✕] │
├─────────────────────────────────────────────┤
│ [23:25:49] CHAT - User message              │
│ [23:25:50] SYS - Command executed           │
│ [23:25:51] ERR - Permission denied          │
└─────────────────────────────────────────────┘

Click [▼] → Se expande con más detalles
Click [✕] → Se oculta completamente
```

---

## 🔴 OVERLAY MODE (Mejorado)

### Estado Actual
- Ventana flotante pequeña
- Solo muestra chat básico

### Overlay Mejorado
```
╔═══════════════════════════════════╗
║ ▣ ARES OVERLAY           [─][✕]  ║
╠═══════════════════════════════════╣
║                                   ║
║  ┌─────────────────────────────┐ ║
║  │ [Mensajes...]               │ ║
║  └─────────────────────────────┘ ║
║                                   ║
║  [📝][⏰][📋][🎤]   [▶️ Send]   ║  ← Acciones rápidas
║                                   ║
║  ┌─────────────────────────────┐ ║
║  │ Escribe...              🎤  │ ║
║  └─────────────────────────────┘ ║
║                                   ║
╠═══════════════════════════════════╣
║ 📋 Tareas: 3  │  ⏰ Timer: --:--  │  ← Status bar
╚═══════════════════════════════════╝
```

### Funciones del Overlay
| Función | Descripción |
|---------|-------------|
| **Siempre visible** | Se queda encima de otras ventanas |
| **Modo compacto** | Reducido a solo input + status |
| **Acciones rápidas** | Botones de uso frecuente |
| **Status bar** | Tareas pendientes, timer activo |
| **Drag & drop** | Mover con el mouse |
| **Resize** | Cambiar tamaño |
| **Transparencia** | Ajustar opacidad |
| **Atajos** | Ctrl+Shift+A para mostrar/ocultar |

### Overlay Compacto
```
┌─────────────────────────────────┐
│ 🎤 Escribe...            [▶️]  │  ← Solo una línea
└─────────────────────────────────┘
```

### Overlay Expandido
```
╔═══════════════════════════════════╗
║ ▣ ARES OVERLAY           [─][✕]  ║
╠═══════════════════════════════════╣
║                                   ║
║  🤖 Ares: "Buenos días..."       ║
║  👤 Tú: "Abre Chrome"            ║
║  🤖 Ares: "✅ Chrome abierto"     ║
║                                   ║
║  [📝][⏰][📋][🎤]   [▶️ Send]   ║
║                                   ║
║  ┌─────────────────────────────┐ ║
║  │ Escribe...              🎤  │ ║
║  └─────────────────────────────┘ ║
║                                   ║
╠═══════════════════════════════════╣
║ 📋 3 │ ⏰ --:-- │ 🌡️ 22°C       │
╚═══════════════════════════════════╝
```

---

## 🟢 LIVE MODE (Mejorado)

### Estado Actual
- Orb azul animado
- Modo de voz básica

### Live Mode Mejorado
```
╔═══════════════════════════════════════════════════════════════╗
║                          ARES LIVE                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║                    ┌─────────────────┐                        ║
║                    │                 │                        ║
║                    │   🔵 ORB        │  ← Orb con estado     ║
║                    │   (pulsando)    │                        ║
║                    │                 │                        ║
║                    └─────────────────┘                        ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  "Escuchando..."  o  "Pensando..."  o  "Hablando..."   │ ║  ← Estado actual
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Transcripción del audio en tiempo real...              │ ║  ← Lo que dice el usuario
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Respuesta de Ares...                                   │ ║  ← Lo que responde
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
║  [🎤][🔊][📷][🖥️]  [⚙️ Live Config]                        ║  ← Controles
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║ 🎤 LISTENING  │  🔊 SPEAKING  │  📷 CAMERA  │  🖥️ SCREEN     ║  ← Status indicators
╚═══════════════════════════════════════════════════════════════╝
```

### Estados del Orb
| Estado | Color | Animación |
|--------|-------|-----------|
| **Idle** | Azul suave | Pulse lento |
| **Listening** | Verde | Rotación rápida |
| **Thinking** | Amarillo | Pulse rápido |
| **Speaking** | Cyan | Ondas expandiéndose |
| **Error** | Rojo | Shake |
| **Processing** | Púrpura | Giro |

### Funciones del Live Mode
| Función | Descripción |
|---------|-------------|
| **Voz natural** | Hablar con Ares como si fuera persona |
| **Transcripción** | Ver lo que dice el usuario en tiempo real |
| **Respuesta visual** | Orb cambia según estado |
| **Cámara** | Analizar lo que ve |
| **Pantalla** | Analizar pantalla actual |
| **Interruptible** | Cortar a Ares hablando |
| **Multi-turn** | Conversación continua sin botón |
| **Modo manos libres** | Activar con wake word "Hey Ares" |

### Panel de Configuración Live
```
╔═════════════════════════════════════╗
║ ⚙️ LIVE CONFIG              [✕]    ║
╠═════════════════════════════════════╣
║                                     ║
║ 🎤 Micrófono: [████████░░] 80%     ║
║ 🔊 Voz:       [██████░░░░] 60%     ║
║ 🗣️ Velocidad: [Normal ▾]           ║
║                                     ║
║ ☐ Wake word: "Hey Ares"            ║
║ ☐ Transcripción visible            ║
║ ☐ Modo manos libres                ║
║                                     ║
║ [🎤 Probar micrófono]              ║
║ [🔊 Probar voz]                     ║
║                                     ║
╚═════════════════════════════════════╝
```

---

## 📱 RESPONSIVE (Móvil)

### Layout Móvil
```
┌─────────────────────┐
│ ▣ ARES        [≡]   │
├─────────────────────┤
│                     │
│  [Chat messages]    │
│                     │
├─────────────────────┤
│ [📝][⏰][📋][🎤]    │  ← Acciones rápidas
├─────────────────────┤
│ ┌───────────────┐🎤│
│ │ Escribe...    │ ➤│
│ └───────────────┘   │
└─────────────────────┘
```

### Sidebar Móvil (Slide-in)
```
┌─────────────────────┐
│ ▣ ARES              │
│─────────────────────│
│ 🔍 Buscar...        │
│─────────────────────│
│ 📱 Todos            │
│─────────────────────│
│ 💬 Chat 1 📱 TG    │
│─────────────────────│
│ 💬 Chat 2 💻 Web   │
│─────────────────────│
│ [+] Nuevo           │
│─────────────────────│
│ ⚙️ Config           │
│ ♿ Accesibilidad    │
│ 🌙 Dark/Light       │
└─────────────────────┘
```

### Gestos Táctiles
| Gesto | Acción |
|-------|--------|
| Swipe derecha | Abrir sidebar |
| Swipe izquierda | Cerrar sidebar |
| Pull down | Refrescar chat |
| Long press mensaje | Copiar/eliminar |
| Double tap | Reaccionar |

---

## 🎯 DASHBOARD WEB (Completo)

```
╔═══════════════════════════════════════════════════════════════════════╗
║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ARES SYSTEM ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   [🌐][⚙️][≡]    ║
╠═════════════════════╦═════════════════════════════════════════════════╣
║                     ║                                                 ║
║  📅 HOY             ║  💬 CONVERSA  [🌐 Todos │ 📱 TG │ 💻 Web]      ║
║  ─────────────      ║  ───────────────────────────────────────────── ║
║  Martes 16          ║                                                 ║
║  🌡️ 22°C Soleado    ║  ┌─────────────────────────────────────────┐   ║
║  📅 3 eventos       ║  │ 🤖 Ares: "Buenos días..."               │   ║
║                     ║  └─────────────────────────────────────────┘   ║
║                     ║                                                 ║
╠═════════════════════╣  ┌─────────────────────────────────────────┐   ║
║                     ║  │ 👤 Tú: "Abre Chrome"                    │   ║
║  ⚡ ACCIONES        ║  └─────────────────────────────────────────┘   ║
║  ─────────────      ║                                                 ║
║  [📝 Nota]          ║  ┌─────────────────────────────────────────┐   ║
║  [⏰ Timer]         ║  │ 🤖 Ares: "✅ Chrome abierto"            │   ║
║  [📋 Tareas]        ║  └─────────────────────────────────────────┘   ║
║  [🎵 Música]        ║                                                 ║
║                     ║  ┌─────────────────────────────────────────┐   ║
╠═════════════════════╣  │ > INPUT_                                │   ║
║                     ║  │ Escribe un mensaje...               🎤🔊│   ║
║  📋 TAREAS (3)      ║  └─────────────────────────────────────────┘   ║
║  ─────────────      ║                                                 ║
║  □ Comprar leche    ║  ┌─────────────────────────────────────────┐   ║
║  □ Terminar info    ║  │ > TERMINAL LOG                  [▼] [✕] │   ║
║  ☑ Llamar doctor   ║  │ [SYS] Ares initialized...               │   ║
║                     ║  └─────────────────────────────────────────┘   ║
╠═════════════════════╣                                                 ║
║                     ║                                                 ║
║  💡 TIP DEL DÍA     ║                                                 ║
║  ─────────────      ║                                                 ║
║  "La productivi-    ║                                                 ║
║   dad es..."        ║                                                 ║
║                     ║                                                 ║
╚═════════════════════╩═════════════════════════════════════════════════╝
```

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

| Archivo | Acción |
|---------|--------|
| `src/config/context.js` | Mejorar detección de intención |
| `src/config/modes.js` | Modos de uso (work/relax/learn) |
| `src/config/scripts.js` | Scripts predefinidos |
| `src/services/reminder.js` | Servicio de recordatorios |
| `src/services/dailyBriefing.js` | Resumen diario |
| `src/services/notes.js` | Gestión de notas |
| `src/services/tasks.js` | Gestión de tareas |
| `src/services/timer.js` | Timer/Pomodoro |
| `src/routes/lifestyle.js` | API endpoints |
| `index_gemini.html` | Mejoras de UI |
| `overlay.html` | Mejoras del overlay |
| `lib/telegram.js` | Comandos rápidos |

---

## 🚀 IMPLEMENTACIÓN

### Fase 1: Contexto Inteligente
1. Mejorar detección de intención
2. Scripts predefinidos
3. Agentes automáticos
4. Contexto situacional

### Fase 2: Lifestyle
5. Resumen diario
6. Notas rápidas
7. Tareas/To-do
8. Timer/Pomodoro

### Fase 3: Overlay Mejorado
9. Acciones rápidas en overlay
10. Status bar
11. Modo compacto/expandido
12. Transparencia/resize

### Fase 4: Live Mode Mejorado
13. Estados del orb
14. Transcripción en tiempo real
15. Configuración de voz
16. Wake word "Hey Ares"

### Fase 5: Ergonomía
17. Sidebar colapsable
18. Terminal colapsable
19. Atajos de teclado
20. Responsive móvil

### Fase 6: Accesibilidad
21. Modo alto contraste
22. Tamaño de fuente
23. Narrador
24. Reducir movimiento

---

**¿Apruebas el plan completo? ¿Qué fase empezamos primero?**

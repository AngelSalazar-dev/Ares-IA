# Memoria del Proyecto

Este archivo es la memoria permanente del proyecto. Aquí se registrarán todos los cambios, planes y acciones realizadas. La información anterior siempre se mantendrá.

---

## Historial

### 2026-05-04 - Inicio de la memoria
Se creó este archivo como memoria permanente del proyecto. A partir de esta fecha, cualquier cambio, plan o acción importante será registrado aquí manteniendo el historial completo.

### 2026-05-04 - Conexión a base de datos TiDB Cloud
- Conectado a MySQL (TiDB Cloud): `mysql://[REDACTED]@[REDACTED]:4000/test`
- Se creó la tabla `conversaciones` para guardar los mensajes de los chats
- La tabla incluye: id, session_id, mensaje, tipo (user/ares), fecha
- Actualizado database.js para usar mysql2/promise correctamente

### 2026-05-04 - Historial de Chats
- Creada tabla `chats` para almacenar sesiones de chat (session_id, titulo, ultimo_mensaje, fechas)
- Agregados endpoints API: GET/POST/PUT/DELETE /api/chats
- Frontend: Panel lateral en el sidebar con lista de chats históricos
- Funcionalidad: Crear nuevos chats, cambiar entre chats, eliminar chats
- Los mensajes se guardan en la base de datos vinculados a cada session_id
- Posibilidad de continuar conversaciones anteriores desde el historial

### 2026-05-04 - Sistema de Base de Datos Local + Sincronización en la Nube
- Implementada base de datos local SQLite (sql.js) en `data/ares.db`
- Flujo de datos: Local → Nube (TiDB)
- Todo se guarda primero en SQLite local (funciona sin internet)
- Sincronización automática cada 30 segundos cuando hay conexión a internet
- Verificación de conexión cada 10 segundos para detectar reconexiones
- Sistema de sincronización: marca registros como "sync=0" locales, los sube a TiDB y los marca como sincronizados
- Si no hay internet, los datos se mantienen en SQLite y se sincronizan cuando se reconecte

### 2026-05-04 - Mejoras en UX del Historial de Chats
- Panel de historial ahora muestra icono, título, vista previa y tiempo relativo (hace X minutos/horas/días)
- Encabezado del chat muestra el nombre del chat actual con botón para renombrar (✏️)
- Cada chat muestra si está activo con borde y glow vermelho
- Botón flotante para crear nuevo chat con efecto de rotación al hover
- Scrollbar personalizado para la lista de chats
- Los mensajes se guardan correctamente vinculados a cada session_id
- Al crear nuevo chat, se genera un ID único y se guarda en localStorage
- Posibilidad de renombrar chats haciendo clic en el botón de edición

### 2026-05-04 - Overlay de Ares + Activación por Voz
- Creado archivo `overlay.html` con un botón flotante que se superpone en la pantalla
- Botón arrastrable para posicionar en cualquier lugar de la pantalla
- **Activación por voz**: dice "Ares" para despertar - abre el chat automáticamente
- **Chat popup**: ventana de chat integrada en el overlay para hablar sin abrir el navegador
- **Reconocimiento de voz continuo**: detecta la palabra "Ares" en segundo plano
- **Síntesis de voz**: Ares responde hablando
- **Menú desplegable** con opciones:
  - Chat (abrir popup de conversación)
  - Cámara (activar/desactivar cámara)
  - Pantalla (compartir pantalla)
  - Video + Pantalla (ambos)
  - Cerrar Overlay
- Acceso desde el chat principal: botón "Overlay Ares" en acciones rápidas
- El overlay funciona en una ventana separada pero conectada al sistema principal

### 2026-05-04 - Sección "En Vivo" Mejorada
- Nuevo diseño con indicadores de estado visuales (punto verde cuando está activo)
- Panel de cámara y pantalla mejorados con badges de estado (Activa/Inactiva)
- Placeholders animados cuando no hay stream activo
- Chat en vivo integrado directamente en la sección
- **Chat con IA**: puedes chatear con Ares mientras transmites
- **Voz integrada**: botón 🎤 para hablar directamente en el chat en vivo
- **Voz para hablar**: botón 🔊 para que Ares responda hablando
- Botón para limpiar el chat
- Estado global que muestra "En vivo" o "En espera"
- Controles visuales mejorados con efectos hover y estados activos

### 2026-05-04 - Ares Puede Ver Cámara/Pantalla
- **Botón "Ares Ve" (👁️)** en la sección En Vivo
- Al hacer clic, captura un frame del video activo
- Usa modelo COCO-SSD local para detección de objetos
- También intenta con APIs de visión como fallback
- Respuesta tanto en texto como en voz
- Usa un canvas oculto para capturar los frames

### 2026-05-04 - Interfaz Estilo Gemini (Chat Unificado)
- **Nueva interfaz**: todo en un solo chat (como Gemini)
- No más secciones separadas (Chat, En Vivo, Archivos, Tareas, Notas)
- **Comandos naturales**: "activa la cámara", "crea una tarea", "nueva nota", "analiza"
- **Panel flotante**: cámara/pantalla aparece en panel al lado del chat
- **Quick Actions**: botones de acceso rápido debajo del chat
- **Glassmorphism**: fondos translúcidos, blur, efectos de vidrio
- **Indicador de escritura**: dots animados mientras Ares pensa
- **Toast Notifications**: alertas visuales al guardar tareas/notas
- **Correcciones del servidor**:
  - Manejo de EADDRINUSE: intenta puertos alternativos si 3000 está ocupado
  - Logs silenciados: solo muestra conexión a TiDB una vez (no spam)

### 2026-05-04 - Glassmorphism y Animaciones "Juicy"
- Fondos translúcidos con `backdrop-filter: blur(16px)`
- Bordes con glow vermelho y sombras riches
- Animaciones de entrada/salida suaves
- Efectos hover que elevan elementos
- Logo con pulso de glow animado
- Transiciones fluidas en botones y mensajes

### 2026-05-04 - Mejoras UI/UX Adicionales
- **Quick Actions mejorados**: Animación de brillo al hover, transform y box-shadow mejorados
- **Indicador de typing mejorado**: Dots con gradiente y glow, texto "Ares está pensando..."
- **Mensajes mejorados**: Animación elástica con cubic-bezier, efecto hover en mensajes, soporte para código bloque y formato
- **Input area refinado**: Glow animado en focus, efectos ripple en botones, tooltips
- **Estado de Ares mejorado**: Animación de brillo y efecto pulse con glow
- **Sidebar mejorado**: Gradientes, efectos shine, mejor spacing, tiempo relativo en chats
- **Panel flotante mejorado**: Estado visual con indicador activo/inactivo, controles mejorados
- **Toast notifications mejoradas**: Barra de progreso, iconos, estados de color, animaciones refined
- **Modal mejorado**: Slide-in animation, efectos shine en hover, mejor diseño de botones
- **Welcome message mejorado**: Animación de entrada/salida, features interactivos
- **Historial de chats**: Tiempo relativo (hace Xm/Xh/Xd), acciones de hover refinadas

### 2026-05-04 - Rediseño UI Estilo TRON
- **Fondo**: Grid retro-futurista con gradientes y efecto scanline CRT
- **Colores**: Palleta roja (#FF2244) como primario (color de Ares)
- **Efectos**: Flicker CRT, scanlines, grid lines en el chat
- **Bordes**: Estilo angular (sin border-radius), decoraciones de esquina
- **Tipografía**: Orbitron para headers, texto con glow y text-shadow
- **Mensajes**: Bordes rectangulares, efecto hover con glow
- **Sidebar**: Decoraciones de esquina, línea brillante debajo del header
- **Botones**: Estilo rectangular, efecto shine al hover
- **Input**: Etiqueta "> INPUT_" como placeholder visual, bordes brillantes
- **Header**: Logo con borde doble, texto "SYSTEM" al lado, estado style TRON
- **Quick Actions**: Estilo "COMMAND BUTTON" con labels uppercase
- **Modal**: Decoraciones de esquina, bordes brillantes, estilo futurista
- **Iconos**: Cambiados emojis por símbolos tipo terminal (◉, ◈, ▸, ▾, ▣)

### 2026-05-04 - Líneas TRON y Animaciones Juicy
- **Líneas TRON rojas**: 5 líneas de energía moviéndose por la pantalla (3 horizontales, 2 verticales)
- **Efecto de cabeza brillante**: Las líneas tienen un punto brillante al frente
- **Scanlines CRT**: Efecto de líneas horizontales móviles en toda la pantalla
- **Animaciones juicy adicionales**:
  - `bounceIn`: Efecto de rebote en botones al hacer click
  - `shake`: Efecto de vibración al hacer hover en items de chat
  - `glitch`: Efecto de glitch en mensajes al hover
  - `glowPulseStrong`: Pulso de brillo intenso en elementos interactivos
  - `dataFlow`: Flujo de datos animado en backgrounds
  - `hologramFlicker`: Parpadeo holográfico en el modal y sidebar
  - `loadingBar`: barra de carga animada
  - `elasticScale`: Escala elástica al hacer click
  - `scanLineMove`: Línea de escaneo en mensajes al hover
  - `matrixRain`: Efecto de lluvia de matrix
  - `circuitPulse`: Pulso de circuito en backgrounds
  - `sparkle`: Chispas en quick actions al hover
- **Efectos interactivos**: Hover glow, ripple en botones, animaciones de entrada/salida
- **Toast animations**: Animaciones de entrada/salida mejorado
- **Welcome message**: Efecto de tipeo/parpadeo

### 2026-05-04 - Terminal de Logs y Limpieza de UI
- **Quick Actions eliminadas**: Removidos los botones de acción rápida
- **Sección "En Vivo" eliminada**: Fusionada con el chat principal
- **Sección Archivos eliminada**: Ya no aparece en la interfaz
- **Nueva Terminal de Logs**:
  - Panel debajo del chat que muestra todos los comandos ejecutados
  - Muestra timestamps, tipos de mensaje (SYS, CMD, OUT, ERR, LOG)
  - Colores diferenciados: system (rojo), command (rosa), output (verde), error (rojo brillante), info (gris)
  - Función para limpiar terminal
  - Soporta hasta 100 líneas de historial
  - Logging automático de:
    - Comandos ejecutados por el usuario
    - Respuestas de la IA
    - Ejecución de aplicaciones
    - Errores y excepciones
    - Inicialización del sistema

### 2026-05-04 - Chat Unificado + Input Expandible + Integración Hermes
- **Sidebar simplificado**: Eliminadas secciones separadas (En Vivo, Archivos, Tareas, Notas, Enlaces)
- **Solo Chat** como vista principal
- **Input expandible**: Botón 📎 para expandir controles
  - 📷 Cámara, 🖥️ Pantalla, 📁 Archivos, 🎤 Voz
- **Video panel flotante**: Aparece a la derecha cuando cámara/pantalla activo
- **Botón Terminal**: ⌨️ en header para mostrar logs
- **Panel Terminal**: Muestra logs de comandos ejecutados
- **Integración Hermes**:
  - Nuevo endpoint `/api/hermes-execute` para ejecutar commands
  - Detecta `CALL:execute_command("cmd")` en respuestas de la IA
  - Envía a execute endpoint y retorna resultado
  - Sistema ARES PROTOCOL: CALL: y EJECUTAR: funcional
- **Video integrado**: Cámara/pantalla como panel flotante
- Backend: `command_executor.js` con funciones para ejecutar comandos del sistema
- API endpoints: `/api/execute`, `/api/mouse`, `/api/keyboard`
- Seguridad: Lista blanca de comandos permitidos (npm, node, code, git, python, etc.)
- Bloqueo de comandos peligrosos (format, rm -rf, drop table, etc.)
- Frontend: Detecta comandos `CALL:function(args)` en respuestas de la IA
- Integración con OpenRouter: System prompt incluye el protocolo ARES
- El usuario puede pedir a Ares que ejecute comandos usando el formato:
  - `CALL:execute_command("npm run dev")`
  - `CALL:mouse_action("click", 500, 300)`
  - `CALL:keyboard_type("hola mundo")`

### 2026-05-04 - Rediseño Overlay Estilo JARVIS (overlay-jarvis.html)
- **Nuevo overlay diseñado para control por voz sin abrir chat**
- **HUD Superior** con información en tiempo real:
  - Hora y fecha actualizadas cada segundo
  - Barras de estado: CPU, RAM, RED (simulado)
  - Indicador de conexión online/offline
- **Panel de Control por Voz** con feedback visual:
  - Visualización de ondas de audio mientras escucha
  - Texto reconocido en tiempo real
  - Comandos directos sin abrir chat
- **Panel de Accesos Rápidos** (derecha del orb):
  - 📷 Cámara (enciende/apaga)
  - 🖥️ Pantalla (comparte/deja de compartir)
  - 🔊 Voz (silencia/activa)
  - 📸 Captura (screenshot)
  - 📝 Notas (abre sección)
  - ✓ Tareas (abre sección)
  - Tooltips con comando de voz equivalente
- **Panel de Estado** (izquierda del orb):
  - Muestra estado actual de cada función
  - Indicadores visuales ON/OFF con color
  - Actualiza en tiempo real
- **Comandos de Voz Directos** (sin chat):
  - "Ares enciende cámara" / "Ares apaga cámara"
  - "Ares comparte pantalla" / "Ares deja de compartir"
  - "Ares captura" / "Ares captura de pantalla"
  - "Ares muestra notas" / "Ares muestra tareas"
  - "Ares habla" / "Ares silencio"
  - "Ares qué hora es" / "Ares qué fecha es"
  - "Ares abre chat" / "Ares cierra chat"
- **Notificaciones toast** para feedback de acciones
- **Feedback de comandos** con animación
- **Estados del orb**: idle, listening (verde), thinking (amarillo), speaking (cyan), active (rojo)
- **Activación por voz**: dice "Ares" para despertar (continúa con comando extra)

### 2026-05-04 - Cambio a Groq API
- **Proveedor de IA**: Cambiado de OpenRouter a Groq
- **API Key**: `[REDACTED]`
- **Modelo**: `llama-3.3-70b-versatile`
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Archivos actualizados**: overlay.html, overlay-jarvis.html
- **Ventajas de Groq**: Respuestas más rápidas, menor latencia

### 2026-05-04 - Mejoras UX del Overlay JARVIS
- **Persistencia de estado**: Estados guardados en localStorage (cámara, pantalla, voz)
- **Comandos de voz expandidos**: +30 comandos naturales adicionales
- **Integración con servidor**: Intenta obtener métricas reales de sistema
- **Atajos de teclado**: Ctrl+Space (activar), C (cámara), S (pantalla), V (voz), M (mute), Esc (cerrar chat)
- **Desactivación con click prolongado**: Mantener orb 2 segundos para desactivar
- **Análisis de pantalla**: Nuevo comando "analiza" para procesar contenido visual
- **Restauración de estado**: Al recargar, recupera estados activos previos
- **Modos especiales**: Modo ahorro y modo presentación disponibles por voz
- **Feedback de voz**: Todos los cambios confirman mediante síntesis de voz

### 2026-05-04 - Interacción con Sistema y Modo Siempre Escuchar
- **Modo siempre escuchar**: Di "Ares" para activar sin usar el orb (comando "escucha siempre")
- **Control de volumen**: "sube volumen", "baja volumen", "silenciar", "volumen al 50%"
- **Control de brillo**: "sube brillo", "baja brillo", "brillo al 80%", "máximo brillo"
- **Abrir aplicaciones**: "abre chrome", "abre spotify", "abre discord", "abre youtube", etc.
- **Control del sistema**: "bloquea pantalla", "reinicia", "qué sistema", "cuál es mi ip"
- **Endpoints agregados en server.js**:
  - `/api/system-volume` - Control de volumen
  - `/api/system-brightness` - Control de brillo
  - `/api/system-lock` - Bloquear pantalla
  - `/api/system-info` - Información del sistema
  - `/api/ip` - Dirección IP
  - `/api/system-stats` - Métricas en tiempo real
  - `/api/analyze-screen` - Análisis visual

### 2026-05-04 - Limpieza del Proyecto
- **Archivos eliminados**:
  - `app/` - Carpeta Next.js Router sin usar
  - `.next/` - Build de Next.js
  - `public/` - Archivos estáticos sin usar
  - `index.html` - Versión antigua duplicada
  - `app.js` - App React sin usar
  - `next.config.js` - Config de Next.js sin usar
  - `install_uv.ps1` - Script de instalación
  - `error.log`, `server.log` - Logs vacíos
- **Archivos vitales conservados**:
  - `server.js` - Servidor principal
  - `database.js` - Base de datos
  - `command_executor.js` - Ejecución de comandos
  - `lib/telegram.js` - Gateway de Telegram
  - `lib/hermes.js` - Integración Hermes
  - `index_gemini.html` - Interfaz principal
  - `overlay-jarvis.html` - Overlay JARVIS
  - `overlay.html` - Overlay básico
  - `style.css` - Estilos
  - `package.json` - Dependencias
  - `.env` - Variables de entorno
  - `MEMORIA.md` - Este archivo

### 2026-05-04 - Tratamiento Formal JARVIS
- **Tratamiento "Señor"**: Ahora ARES trata al usuario de forma formal como JARVIS
- **Comandos de configuración**:
  - "mi nombre es [nombre]" - Para que ARES te llame por tu nombre
  - "llámame [nombre]" - Alias anterior
  - "cómo me llamo" - Muestra el nombre guardado
  - "trátame de tú/vos" - Cambia a tratamiento informal
  - "trátame de usted" - Cambia a tratamiento formal
- **Modo siempre escuchar** activado por defecto
- **Comandos de voz expandidos**: +60 comandos naturales para control de voz, aplicaciones, sistema

### 2026-05-04 - Migración a Next.js 14
- **Framework**: Express.js → Next.js 14 (App Router)
- **Estructura**:
  - `app/page.js` - Página principal con:
    - Interfaz TRON completa
    - Chat con IA (Groq/Llama)
    - Terminal de logs
    - Controles de cámara/pantalla/voz
    - Reconocimiento de voz (decir "Ares")
    - Botones de acción rápida
  - `app/layout.js` - Layout raíz
  - `app/globals.css` - Estilos globales
  - `app/api/chat/route.js` - Chat con IA
  - `app/api/execute/route.js` - Ejecutar comandos
  - `app/api/system-lock/route.js` - Bloquear pantalla
  - `app/api/system-volume/route.js` - Control volumen
  - `app/api/system-info/route.js` - Info del sistema
  - `app/api/system-stats/route.js` - Métricas en tiempo real
  - `public/overlay-jarvis.html` - Overlay JARVIS (legacy)
- **Puerto**: 3001
- **Comandos**: `npm run dev` (desarrollo), `npm run build` (producción)
- **Funcionalidades migradas**:
  - Chat con IA (Groq)
  - Reconocimiento de voz
  - Síntesis de voz
  - Control de cámara/pantalla
  - Terminal de logs
  - Ejecución de comandos
  - Control de sistema (bloquear)

### 2026-05-05 - Mejoras en Funciones Live
- **+50 nuevos comandos de voz**:
  - OCR: "leer texto", "qué dice"
  - Grabación: "grabar sesión", "detener grabación"
  - Captura: "captura", "screenshot", "toma foto"
  - Estado: "estado", "reporta", "status"
  - Idioma: "habla español", "habla inglés", "habla português"
  - Cámara: "activa cámara", "enciende cámara", "apaga cámara"
  - Pantalla: "activa pantalla", "comparte pantalla", "deja de compartir"
  - Voz: "activa voz", "silénciame", "escúchame"
  - Config: "configuración", "ajustes"
  - Modos: "modo presentación", "modo normal"
  - Reinicio: "restart", "reinicia", "recarga"
  - Scripts: "nuevo script", "crea script"
  - Wellness: "estoy bien", "cómo estás"
  - Hora/Fecha: "qué hora es", "qué fecha es"
- **Análisis de video con OCR**: Nueva función analyzeLiveOCR() para extraer texto
- **Grabación de sesiones**: startLiveRecording(), stopLiveRecording() - graba y descarga como WebM
- **Captura de frames**: captureLiveFrame() - guarda imagen PNG
- **Reporte de estado**: reportLiveStatus() - lista todos los estados activos
- **Settings modal**: openSettings() - abre panel de configuración
- **Nuevos estados en state**: liveRecording, liveRecordingChunks, livePresentation

### 2026-05-05 - Mejoras en Hablar y Escuchar
- **TTS (Hablar) mejorado**:
  - Múltiples idiomas: es-ES, en-US, pt-BR, fr-FR, de-DE
  - Control de velocidad: "habla más lento", "habla más rápido", "velocidad"
  - Control de tono y volumen
  - Función prueba: speakTest(), stopSpeaking()
  - Detección automática de voces disponibles
  - Estados: liveTTSLang, liveTTSRate, liveTTSPitch, liveTTSVolume
- **STT (Escuchar) mejorado**:
  - Múltiples idiomas de reconocimiento
  - Confianza de reconocimiento mostrada en logs
  - Texto intermedio mostrado en tiempo real
  - Reinicio automático robusto
  - Manejo de errores mejorado (no-speech, aborted)
  - Estados: liveSTTLang
  - Funciones: setSTTLanguage(), restartVoiceRecognition()
- **Nuevos comandos de voz**:
  - "habla español/inglés/portugués" - idioma de voz
  - "prueba voz", "detén voz"
  - "reconocimiento", "reinicla voz"
  - "qué idioma"
  - "silénciame", "cállate" (nuevos efectos)
- **Wake words extendidos**: +jarvis, +hermes

### 2026-05-06 - Refactorización Premium y Estabilidad de Sistema
- **VoiceManager V2 (Anti-Loop)**: Implementación de una clase robusta para el reconocimiento de voz. Incluye un sistema de **Exponential Backoff** que evita el spam de peticiones al navegador en caso de errores o desconexiones.
- **ContextManager (Memoria Fluida)**: Ares ahora utiliza una estructura de datos dedicada para gestionar el historial de conversación. Mantiene un contexto de los últimos 15 mensajes, permitiendo diálogos coherentes y naturales.
- **Estética Premium TRON**: Transición a una paleta de colores de alta fidelidad. Fondos en negro profundo (`#050507`), acentos en rojo neón refinado (`#FF1133`) y efectos de **Glassmorphism** (desenfoque de cristal) en todos los paneles.
- **Optimización de Interfaz**: Se mejoró el diseño de las burbujas de chat y la respuesta visual del "Neural Core" para una experiencia más fluida y profesional.
- **Seguridad Reforzada**: Se consolidaron los filtros de comandos tanto en frontend como en el ejecutor de servidor.

---

## Cómo usar esta memoria

Para actualizar este archivo con un nuevo registro:
1. Agregar la fecha al inicio del nuevo contenido
2. Incluir la descripción del cambio, plan o acción
3. Mantener toda la información anterior intacta

---

## Actualización automática

Este archivo será actualizado de manera automática por la IA (asistente) después de cada cambio, plan o acción realizada en el proyecto. La IA agregará los nuevos registros al historial manteniendo toda la información anterior intacta.
/**
 * Tool Executor Service
 * Ejecuta las acciones de las herramientas
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ToolExecutor {
    constructor() {
        this.executionHistory = [];
    }

    /**
     * Ejecuta una herramienta
     * @param {string} toolId - ID de la herramienta
     * @param {Object} params - Parámetros de la herramienta
     * @param {Object} options - Opciones adicionales
     * @returns {Object} - { success, result, error }
     */
    async execute(toolId, params, options = {}) {
        const startTime = Date.now();

        try {
            let result;

            switch (toolId) {
                case 'execute_command':
                    result = await this._executeCommand(params.command, options);
                    break;
                case 'open_application':
                    result = await this._openApplication(params.appName);
                    break;
                case 'system_lock':
                    result = await this._lockScreen();
                    break;
                case 'system_volume':
                    result = await this._controlVolume(params.action, params.level);
                    break;
                case 'system_brightness':
                    result = await this._controlBrightness(params.level);
                    break;
                case 'read_file':
                    result = await this._readFile(params.path);
                    break;
                case 'write_file':
                    result = await this._writeFile(params.path, params.content);
                    break;
                case 'list_directory':
                    result = await this._listDirectory(params.path);
                    break;
                case 'get_system_info':
                    result = await this._getSystemInfo(params.infoType);
                    break;
                case 'get_ip':
                    result = await this._getIP();
                    break;
                default:
                    result = { success: false, error: `Herramienta no implementada: ${toolId}` };
            }

            const execution = {
                toolId,
                params,
                result,
                duration: Date.now() - startTime,
                timestamp: Date.now()
            };

            this.executionHistory.push(execution);

            // Mantener solo los últimos 50 registros
            if (this.executionHistory.length > 50) {
                this.executionHistory = this.executionHistory.slice(-50);
            }

            return result;

        } catch (error) {
            const execution = {
                toolId,
                params,
                result: { success: false, error: error.message },
                duration: Date.now() - startTime,
                timestamp: Date.now()
            };

            this.executionHistory.push(execution);

            return { success: false, error: error.message };
        }
    }

    /**
     * Obtiene el historial de ejecuciones
     * @returns {Array}
     */
    getHistory() {
        return this.executionHistory;
    }

    // --- Métodos de ejecución ---

    async _executeCommand(command, options = {}) {
        return new Promise((resolve) => {
            const timeout = options.timeout || 30000;

            exec(command, { timeout, encoding: 'utf8' }, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        output: error.message,
                        stderr: stderr || ''
                    });
                } else {
                    resolve({
                        success: true,
                        output: stdout || '',
                        stderr: stderr || ''
                    });
                }
            });
        });
    }

    async _openApplication(appName) {
        try {
            // Windows
            if (process.platform === 'win32') {
                exec(`start ${appName}`);
                return { success: true, message: `${appName} iniciado` };
            }
            // macOS
            else if (process.platform === 'darwin') {
                exec(`open -a ${appName}`);
                return { success: true, message: `${appName} iniciado` };
            }
            // Linux
            else {
                exec(`${appName} &`);
                return { success: true, message: `${appName} iniciado` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _lockScreen() {
        try {
            if (process.platform === 'win32') {
                exec('rundll32.exe user32.dll,LockWorkStation');
                return { success: true, message: 'Pantalla bloqueada' };
            } else if (process.platform === 'darwin') {
                exec('pmset displaysleepnow');
                return { success: true, message: 'Pantalla bloqueada' };
            } else {
                exec('xdg-screensaver lock');
                return { success: true, message: 'Pantalla bloqueada' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _controlVolume(action, level) {
        try {
            if (process.platform === 'win32') {
                switch (action) {
                    case 'up':
                        exec('nircmd.exe changesysvolume 5000');
                        return { success: true, message: 'Volumen subido' };
                    case 'down':
                        exec('nircmd.exe changesysvolume -5000');
                        return { success: true, message: 'Volumen bajado' };
                    case 'mute':
                        exec('nircmd.exe mutesysvolume 1');
                        return { success: true, message: 'Volumen silenciado' };
                    case 'unmute':
                        exec('nircmd.exe mutesysvolume 0');
                        return { success: true, message: 'Volumen activado' };
                    case 'set':
                        const volume = Math.round((level / 100) * 65535 - 32768);
                        exec(`nircmd.exe setsysvolume ${volume}`);
                        return { success: true, message: `Volumen ajustado a ${level}%` };
                    default:
                        return { success: false, error: 'Acción no válida' };
                }
            }
            return { success: false, error: 'Plataforma no soportada para control de volumen' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _controlBrightness(level) {
        try {
            if (process.platform === 'win32') {
                exec(`powershell (Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${level})`);
                return { success: true, message: `Brillo ajustado a ${level}%` };
            }
            return { success: false, error: 'Plataforma no soportada para control de brillo' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _readFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return { success: true, content };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _writeFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
            return { success: true, message: `Archivo escrito: ${filePath}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _listDirectory(dirPath) {
        try {
            const targetPath = dirPath || '.';
            const items = fs.readdirSync(targetPath);
            return { success: true, items };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _getSystemInfo(infoType = 'all') {
        try {
            const os = require('os');
            const info = {
                platform: process.platform,
                arch: process.arch,
                hostname: os.hostname(),
                uptime: os.uptime(),
                cpus: os.cpus().length,
                totalMemory: os.totalmem(),
                freeMemory: os.freemem()
            };
            return { success: true, info };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async _getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return { success: true, ip: data.ip };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = { ToolExecutor };

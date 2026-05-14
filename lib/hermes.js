/**
 * ARES Integration with Hermes Agent
 * API que conecta Next.js con Hermes CLI
 */

const { spawn } = require('child_process');
const path = require('path');

const HERMES_ENV = path.join(__dirname, '../hermes-env/Scripts');
const HERMES_SOURCE = path.join(__dirname, '../hermes-source');

function hermesCommand(args) {
  return new Promise((resolve, reject) => {
    const hermesBin = path.join(HERMES_ENV, 'hermes.exe');
    const proc = spawn(hermesBin, args, {
      cwd: HERMES_SOURCE,
      shell: true,
      env: { ...process.env, PYTHONPATH: HERMES_SOURCE }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout));
    });
    proc.on('error', reject);
  });
}

async function chat(message, history = []) {
  const historyArg = history.map(m => `${m.role}: ${m.content}`).join('\n');
  const fullPrompt = historyArg ? `${historyArg}\nuser: ${message}` : message;
  
  try {
    const result = await hermesCommand(['chat', '-p', fullPrompt]);
    return result;
  } catch (e) {
    console.error('[Hermes Error]', e.message);
    return `Error: ${e.message}`;
  }
}

async function executeCommand(cmd) {
  try {
    const result = await hermesCommand(['terminal', cmd]);
    return { success: true, output: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

module.exports = { chat, executeCommand };
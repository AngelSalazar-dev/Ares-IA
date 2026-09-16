/**
 * Tests para command_executor.js
 */

const { 
    sanitizeCommand, 
    isCommandSafe, 
    isCommandAllowed 
} = require('../command_executor');

describe('Command Executor', () => {
    
    describe('sanitizeCommand', () => {
        test('elimina espacios al inicio y final', () => {
            expect(sanitizeCommand('  npm install  ')).toBe('npm install');
        });

        test('elimina comillas circundantes', () => {
            expect(sanitizeCommand('"npm install"')).toBe('npm install');
            expect(sanitizeCommand("'npm install'")).toBe('npm install');
        });

        test('elimina espacios múltiples', () => {
            expect(sanitizeCommand('npm   install   express')).toBe('npm install express');
        });

        test('maneja strings vacíos', () => {
            expect(sanitizeCommand('')).toBe('');
            expect(sanitizeCommand(null)).toBe('');
            expect(sanitizeCommand(undefined)).toBe('');
        });
    });

    describe('isCommandSafe', () => {
        test('rechaza comandos con punto y coma (inyección)', () => {
            const result = isCommandSafe('npm install; rm -rf /');
            expect(result.safe).toBe(false);
        });

        test('rechaza comandos con pipe', () => {
            const result = isCommandSafe('cat file | sh');
            expect(result.safe).toBe(false);
        });

        test('rechaza comandos con backticks', () => {
            const result = isCommandSafe('echo `whoami`');
            expect(result.safe).toBe(false);
        });

        test('rechaza comandos con $()', () => {
            const result = isCommandSafe('echo $(whoami)');
            expect(result.safe).toBe(false);
        });

        test('rechaza path traversal', () => {
            const result = isCommandSafe('cat ../../etc/passwd');
            expect(result.safe).toBe(false);
        });

        test('rechaza comandos demasiado largos', () => {
            const longCmd = 'a'.repeat(600);
            const result = isCommandSafe(longCmd);
            expect(result.safe).toBe(false);
        });

        test('acepta comandos normales', () => {
            expect(isCommandSafe('npm install').safe).toBe(true);
            expect(isCommandSafe('git status').safe).toBe(true);
            expect(isCommandSafe('dir').safe).toBe(true);
        });
    });

    describe('isCommandAllowed', () => {
        test('permite comandos de la whitelist', () => {
            expect(isCommandAllowed('npm install')).toBe(true);
            expect(isCommandAllowed('git status')).toBe(true);
            expect(isCommandAllowed('node app.js')).toBe(true);
            expect(isCommandAllowed('dir')).toBe(true);
            expect(isCommandAllowed('ls')).toBe(true);
        });

        test('rechaza comandos no whitelist', () => {
            expect(isCommandAllowed('rm -rf /')).toBe(false);
            expect(isCommandAllowed('sudo apt')).toBe(false);
        });

        test('rechaza comandos peligrosos', () => {
            expect(isCommandAllowed('format c:')).toBe(false);
            expect(isCommandAllowed('del /f')).toBe(false);
            expect(isCommandAllowed('shutdown')).toBe(false);
        });

        test('case insensitive', () => {
            expect(isCommandAllowed('NPM install')).toBe(true);
            expect(isCommandAllowed('GIT status')).toBe(true);
        });
    });
});

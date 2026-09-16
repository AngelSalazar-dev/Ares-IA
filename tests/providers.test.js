/**
 * Tests para src/config/providers.js
 */

// Mock fetch globally
global.fetch = jest.fn();

describe('Providers', () => {
    let providers;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset modules to get fresh state
        jest.resetModules();
        
        // Set env vars for testing
        process.env.GROQ_API_KEY = 'test-groq-key';
        process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
        process.env.GROQ_MODEL = 'test-model';
        process.env.OPENROUTER_MODEL = 'test-or-model';
        
        providers = require('../src/config/providers');
    });

    afterEach(() => {
        delete process.env.GROQ_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
    });

    describe('getProviderStatus', () => {
        test('retorna estado de providers', () => {
            const status = providers.getProviderStatus();
            
            expect(status).toHaveProperty('groq');
            expect(status).toHaveProperty('openrouter');
            expect(status.groq).toHaveProperty('enabled');
            expect(status.groq).toHaveProperty('inCooldown');
            expect(status.groq).toHaveProperty('model');
        });

        test('groq enabled cuando hay API key', () => {
            const status = providers.getProviderStatus();
            expect(status.groq.enabled).toBe(true);
        });

        test('openrouter enabled cuando hay API key', () => {
            const status = providers.getProviderStatus();
            expect(status.openrouter.enabled).toBe(true);
        });
    });

    describe('getAIResponse', () => {
        test('usa groq cuando está disponible', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Respuesta de Groq' } }]
                })
            });

            const messages = [{ role: 'user', content: 'Hola' }];
            const response = await providers.getAIResponse(messages);
            
            expect(response).toBe('Respuesta de Groq');
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.groq.com/openai/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-groq-key'
                    })
                })
            );
        });

        test('fallback a openrouter cuando groq falla', async () => {
            // Groq falla
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Error'
            });

            // OpenRouter funciona
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Respuesta de OpenRouter' } }]
                })
            });

            const messages = [{ role: 'user', content: 'Hola' }];
            const response = await providers.getAIResponse(messages);
            
            expect(response).toBe('Respuesta de OpenRouter');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        test('retorna mensaje de error cuando todos fallan', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
                text: async () => 'Error'
            });

            const messages = [{ role: 'user', content: 'Hola' }];
            const response = await providers.getAIResponse(messages);
            
            expect(response).toContain('indisponibles');
        });
    });
});

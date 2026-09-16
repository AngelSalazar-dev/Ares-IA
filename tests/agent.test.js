/**
 * Tests for Agent System
 */

const { AresAgent } = require('../src/config/agent');
const { ContextManager } = require('../src/config/context');
const { PermissionManager } = require('../src/config/permissions');
const { AresMood } = require('../src/config/ares-mood');
const { getPersonality, listPersonalities } = require('../src/config/personalities');
const { getTool, listTools, toOpenAIFunctions } = require('../src/config/tools');

describe('AresAgent', () => {
    let agent;

    beforeEach(() => {
        agent = new AresAgent({ sessionId: 'test-session' });
    });

    describe('Constructor', () => {
        test('should create agent with default options', () => {
            const defaultAgent = new AresAgent();
            expect(defaultAgent.personalityId).toBe('default');
            expect(defaultAgent.sessionId).toBe('default');
        });

        test('should create agent with custom options', () => {
            expect(agent.personalityId).toBe('default');
            expect(agent.sessionId).toBe('test-session');
        });
    });

    describe('processMessage', () => {
        test('should process a simple message', async () => {
            const result = await agent.processMessage('Hola Ares');
            expect(result).toHaveProperty('messages');
            expect(result).toHaveProperty('emotion');
            expect(result).toHaveProperty('intent');
            expect(result).toHaveProperty('personality');
            expect(result).toHaveProperty('mood');
            expect(result).toHaveProperty('contextStats');
        });

        test('should detect happy emotion', async () => {
            const result = await agent.processMessage('Esto es genial!');
            expect(result.emotion.emotion).toBe('happy');
        });

        test('should detect technical intent', async () => {
            const result = await agent.processMessage('Necesito ayuda con código JavaScript');
            expect(result.intent.isTechnical).toBe(true);
        });

        test('should detect conversational intent', async () => {
            const result = await agent.processMessage('Hola');
            expect(result.intent.type).toBe('conversational');
        });

        test('should include system prompt in messages', async () => {
            const result = await agent.processMessage('Test');
            expect(result.messages[0].role).toBe('system');
            expect(result.messages[0].content).toContain('ARES');
        });
    });

    describe('Personality', () => {
        test('should change personality', () => {
            agent.setPersonality('jarvis');
            expect(agent.personalityId).toBe('jarvis');
        });

        test('should use new personality in next message', async () => {
            agent.setPersonality('casual');
            const result = await agent.processMessage('Hola');
            expect(result.personality.id).toBe('casual');
            expect(result.personality.name).toBe('Casual');
        });
    });

    describe('State Management', () => {
        test('should get agent state', () => {
            const state = agent.getState();
            expect(state).toHaveProperty('sessionId');
            expect(state).toHaveProperty('personality');
            expect(state).toHaveProperty('mood');
            expect(state).toHaveProperty('context');
            expect(state).toHaveProperty('permissions');
        });

        test('should record response', () => {
            agent.recordResponse('Test response', []);
            const state = agent.getState();
            expect(state.context.historySize).toBe(1);
        });

        test('should record tool usage', () => {
            agent.recordResponse('Response', [{ toolId: 'test' }]);
            const state = agent.getState();
            expect(state.toolCallCount).toBe(1);
        });

        test('should reset agent', () => {
            agent.setPersonality('jarvis');
            agent.recordResponse('Test', []);
            agent.reset();
            
            expect(agent.personalityId).toBe('default');
            expect(agent.toolCallCount).toBe(0);
        });

        test('should export and import state', () => {
            agent.setPersonality('casual');
            agent.recordResponse('Test', []);
            
            const exported = agent.exportState();
            expect(exported.personalityId).toBe('casual');
            
            const newAgent = new AresAgent({ sessionId: 'new-session' });
            newAgent.importState(exported);
            expect(newAgent.personalityId).toBe('casual');
        });
    });
});

describe('ContextManager', () => {
    let context;

    beforeEach(() => {
        context = new ContextManager();
    });

    test('should have 131K token window', () => {
        expect(context.maxTokens).toBe(131072);
    });

    test('should add messages', () => {
        const result = context.addMessage('user', 'Hello');
        expect(result.added).toBe(true);
        expect(result.historySize).toBe(1);
    });

    test('should estimate tokens', () => {
        const tokens = context.estimateTokens('Hello World');
        expect(tokens).toBeGreaterThan(0);
    });

    test('should get stats', () => {
        context.addMessage('user', 'Test message');
        const stats = context.getStats();
        expect(stats).toHaveProperty('maxTokens');
        expect(stats).toHaveProperty('usedTokens');
        expect(stats).toHaveProperty('usagePercent');
    });

    test('should check space', () => {
        expect(context.hasSpace('Short message')).toBe(true);
    });

    test('should clear history', () => {
        context.addMessage('user', 'Test');
        context.clear();
        expect(context.history.length).toBe(0);
    });

    test('should export and import', () => {
        context.addMessage('user', 'Test');
        const exported = context.export();
        expect(exported.history.length).toBe(1);
        
        const newContext = new ContextManager();
        newContext.import(exported);
        expect(newContext.history.length).toBe(1);
    });
});

describe('PermissionManager', () => {
    let permissions;

    beforeEach(() => {
        permissions = new PermissionManager();
    });

    test('should create session', () => {
        const session = permissions.createSession('test', 1);
        expect(session.id).toBe('test');
        expect(session.level).toBe(1);
    });

    test('should check permissions', () => {
        permissions.createSession('test', 1);
        expect(permissions.hasPermission('test', 'ai:chat')).toBe(true);
        expect(permissions.hasPermission('test', 'command:execute')).toBe(false);
    });

    test('should check tool execution', () => {
        permissions.createSession('test', 1);
        const result = permissions.canExecuteTool('test', 'open_application');
        expect(result.allowed).toBe(true);
    });

    test('should request confirmation', () => {
        permissions.createSession('test', 1);
        const token = permissions.requestConfirmation('test', 'execute_command', { command: 'test' });
        expect(token).toBeTruthy();
    });

    test('should confirm action', () => {
        permissions.createSession('test', 1);
        const token = permissions.requestConfirmation('test', 'execute_command', { command: 'test' });
        const result = permissions.confirmAction('test', token);
        expect(result.confirmed).toBe(true);
    });

    test('should detect dangerous commands', () => {
        expect(permissions.isDangerousCommand('rm -rf /')).toBe(true);
        expect(permissions.isDangerousCommand('ls')).toBe(false);
    });

    test('should cleanup expired sessions', () => {
        permissions.createSession('test', 1);
        const cleaned = permissions.cleanupSessions();
        expect(cleaned).toBe(0); // Session is still fresh
    });
});

describe('AresMood', () => {
    let mood;

    beforeEach(() => {
        mood = new AresMood();
    });

    test('should start with neutral mood', () => {
        const current = mood.getMood();
        expect(current.id).toBe('neutral');
    });

    test('should update from happy emotion', () => {
        mood.updateFromUserEmotion('happy');
        const current = mood.getMood();
        expect(current.id).toBe('cheerful');
    });

    test('should update from sad emotion', () => {
        mood.updateFromUserEmotion('sad');
        const current = mood.getMood();
        expect(current.id).toBe('empathetic');
    });

    test('should record command errors', () => {
        for (let i = 0; i < 4; i++) {
            mood.recordCommandError();
        }
        const current = mood.getMood();
        expect(current.id).toBe('cautious');
    });

    test('should generate mood suffix', () => {
        const suffix = mood.getMoodSuffix();
        expect(suffix).toContain('ESTADO ACTUAL DE ARES');
        expect(suffix).toContain('Neutral');
    });

    test('should reset mood', () => {
        mood.updateFromUserEmotion('happy');
        mood.reset();
        const current = mood.getMood();
        expect(current.id).toBe('neutral');
    });
});

describe('Personalities', () => {
    test('should get default personality', () => {
        const p = getPersonality('default');
        expect(p.name).toBe('Normal');
    });

    test('should get jarvis personality', () => {
        const p = getPersonality('jarvis');
        expect(p.name).toBe('JARVIS');
    });

    test('should return default for unknown', () => {
        const p = getPersonality('unknown');
        expect(p.name).toBe('Normal');
    });

    test('should list all personalities', () => {
        const list = listPersonalities();
        expect(list.length).toBe(7);
        expect(list[0]).toHaveProperty('id');
        expect(list[0]).toHaveProperty('name');
        expect(list[0]).toHaveProperty('emoji');
    });
});

describe('Tools', () => {
    test('should get tool by id', () => {
        const tool = getTool('execute_command');
        expect(tool.name).toBe('Ejecutar Comando');
    });

    test('should return null for unknown tool', () => {
        const tool = getTool('unknown');
        expect(tool).toBeNull();
    });

    test('should list all tools', () => {
        const list = listTools();
        expect(list.length).toBeGreaterThan(0);
    });

    test('should convert to OpenAI functions', () => {
        const functions = toOpenAIFunctions();
        expect(functions.length).toBeGreaterThan(0);
        expect(functions[0]).toHaveProperty('type', 'function');
        expect(functions[0].function).toHaveProperty('name');
        expect(functions[0].function).toHaveProperty('description');
    });
});

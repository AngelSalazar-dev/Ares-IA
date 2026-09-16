/**
 * Tests for Emotions System
 */

const {
    EMOTIONS,
    EMOTION_EMOJIS,
    detectUserEmotion,
    isConversationalIntent,
    isTechnicalIntent
} = require('../src/config/emotions');

describe('Emotions System', () => {
    describe('detectUserEmotion', () => {
        test('should detect neutral emotion for empty input', () => {
            const result = detectUserEmotion('');
            expect(result.emotion).toBe(EMOTIONS.neutral);
            expect(result.emoji).toBe('😐');
        });

        test('should detect neutral emotion for null input', () => {
            const result = detectUserEmotion(null);
            expect(result.emotion).toBe(EMOTIONS.neutral);
        });

        test('should detect happy emotion', () => {
            const result = detectUserEmotion('Esto es genial! Me encanta');
            expect(result.emotion).toBe(EMOTIONS.happy);
            expect(result.emoji).toBe('😊');
        });

        test('should detect sad emotion', () => {
            const result = detectUserEmotion('Me siento muy triste hoy');
            expect(result.emotion).toBe(EMOTIONS.sad);
            expect(result.emoji).toBe('😢');
        });

        test('should detect angry emotion', () => {
            const result = detectUserEmotion('ESTO ES ENOJANTE!!! ODIO ESTO');
            expect(result.emotion).toBe(EMOTIONS.angry);
            expect(result.emoji).toBe('😤');
        });

        test('should detect frustrated emotion', () => {
            const result = detectUserEmotion('No funciona, no entiendo el error');
            expect(result.emotion).toBe(EMOTIONS.frustrated);
        });

        test('should detect curious emotion', () => {
            const result = detectUserEmotion('Cómo funciona esto? Explícame');
            expect(result.emotion).toBe(EMOTIONS.curious);
        });

        test('should detect excited emotion', () => {
            const result = detectUserEmotion('Vamos! Estoy emocionado por el proyecto');
            expect(result.emotion).toBe(EMOTIONS.excited);
        });

        test('should detect grateful emotion', () => {
            const result = detectUserEmotion('Gracias! Me ayudaste mucho');
            expect(result.emotion).toBe(EMOTIONS.grateful);
        });

        test('should detect tired emotion', () => {
            const result = detectUserEmotion('Estoy cansado, no puedo más');
            expect(result.emotion).toBe(EMOTIONS.tired);
        });

        test('should increase intensity with exclamation marks', () => {
            const result1 = detectUserEmotion('Esto está bien');
            const result2 = detectUserEmotion('Esto está increíble!!!');
            expect(result2.intensity).toBeGreaterThan(result1.intensity);
        });

        test('should detect uppercase as angry', () => {
            const result = detectUserEmotion('NO PUEDO CREER ESTO');
            expect(result.emotion).toBe(EMOTIONS.angry);
        });
    });

    describe('isConversationalIntent', () => {
        test('should detect greetings', () => {
            expect(isConversationalIntent('hola')).toBe(true);
            expect(isConversationalIntent('hello')).toBe(true);
            expect(isConversationalIntent('buenos días')).toBe(true);
        });

        test('should detect questions about Ares', () => {
            expect(isConversationalIntent('quién eres')).toBe(true);
            expect(isConversationalIntent('cómo estás')).toBe(true);
        });

        test('should detect short messages as conversational', () => {
            expect(isConversationalIntent('hey')).toBe(true);
            expect(isConversationalIntent('ok')).toBe(true);
        });

        test('should not detect code as conversational', () => {
            expect(isConversationalIntent('function test() {}')).toBe(false);
            expect(isConversationalIntent('const x = 1;')).toBe(false);
        });
    });

    describe('isTechnicalIntent', () => {
        test('should detect code keywords', () => {
            expect(isTechnicalIntent('necesito ayuda con código')).toBe(true);
            expect(isTechnicalIntent('hay un error en la función')).toBe(true);
        });

        test('should detect programming languages', () => {
            expect(isTechnicalIntent('cómo uso JavaScript')).toBe(true);
            expect(isTechnicalIntent('ayuda con React')).toBe(true);
        });

        test('should detect code patterns', () => {
            expect(isTechnicalIntent('function() {}')).toBe(true);
            expect(isTechnicalIntent('if (x > 0)')).toBe(true);
        });

        test('should not detect casual conversation as technical', () => {
            expect(isTechnicalIntent('hola cómo estás')).toBe(false);
            expect(isTechnicalIntent('cuéntame algo')).toBe(false);
        });
    });

    describe('Constants', () => {
        test('should have all emotion emojis defined', () => {
            for (const emotion of Object.values(EMOTIONS)) {
                expect(EMOTION_EMOJIS[emotion]).toBeDefined();
            }
        });

        test('should have 12 emotions defined', () => {
            expect(Object.keys(EMOTIONS).length).toBe(12);
        });
    });
});

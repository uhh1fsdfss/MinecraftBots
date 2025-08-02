const OpenAI = require('openai');
const logger = require('../utils/logger');

class AIChat {
    constructor(bot) {
        this.bot = bot;
        this.openai = null;
        this.chatHistory = new Map(); // Store chat history per player
        this.maxHistoryLength = parseInt(process.env.MAX_CHAT_HISTORY) || 50;
        this.responseDelay = parseInt(process.env.RESPONSE_DELAY) || 1000;
        
        this.initializeOpenAI();
    }

    initializeOpenAI() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            logger.warn('⚠️ OpenAI API key not configured. AI chat will be disabled.');
            return;
        }

        try {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
            logger.info('✅ OpenAI initialized successfully');
        } catch (error) {
            logger.error('❌ Failed to initialize OpenAI:', error);
        }
    }

    async handleMessage(username, message) {
        // Skip if AI is not configured
        if (!this.openai) {
            return;
        }

        // Skip if message is too short or looks like a command
        if (message.length < 3 || message.startsWith('!')) {
            return;
        }

        // Check if bot is mentioned or if it's a direct question
        const botMentioned = message.toLowerCase().includes(this.bot.username.toLowerCase()) ||
                           message.includes('бот') ||
                           message.includes('помощник') ||
                           message.endsWith('?');

        if (!botMentioned) {
            // Only respond to 20% of random messages to avoid spam
            if (Math.random() > 0.2) {
                return;
            }
        }

        try {
            const response = await this.generateResponse(username, message);
            
            if (response) {
                // Add delay to make responses feel more natural
                setTimeout(() => {
                    this.bot.chat(response);
                }, this.responseDelay);
            }
        } catch (error) {
            logger.error('❌ Error generating AI response:', error);
        }
    }

    async generateResponse(username, message) {
        try {
            // Get or create chat history for this player
            if (!this.chatHistory.has(username)) {
                this.chatHistory.set(username, []);
            }

            const history = this.chatHistory.get(username);
            
            // Add user message to history
            history.push({ role: 'user', content: `${username}: ${message}` });
            
            // Trim history if too long
            if (history.length > this.maxHistoryLength) {
                history.splice(0, history.length - this.maxHistoryLength);
            }

            // Prepare system prompt
            const systemPrompt = this.getSystemPrompt();
            
            // Prepare messages for OpenAI
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.slice(-10) // Use last 10 messages for context
            ];

            const completion = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 150,
                temperature: 0.8,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            });

            const response = completion.choices[0]?.message?.content?.trim();
            
            if (response) {
                // Add bot response to history
                history.push({ role: 'assistant', content: response });
                
                // Clean up response (remove bot name if present)
                const cleanResponse = response.replace(/^[^:]+:\s*/, '');
                
                return cleanResponse;
            }

        } catch (error) {
            logger.error('❌ OpenAI API error:', error);
            
            // Fallback responses
            const fallbackResponses = [
                'Извините, у меня проблемы с обработкой сообщения 🤖',
                'Не могу сейчас ответить, попробуйте позже 😅',
                'Что-то пошло не так с моим ИИ 🔧'
            ];
            
            return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }

        return null;
    }

    getSystemPrompt() {
        const botPos = this.bot.entity?.position;
        const health = this.bot.health;
        const food = this.bot.food;
        const time = this.bot.time?.timeOfDay;
        const weather = this.bot.isRaining ? 'дождь' : 'ясно';
        const players = Object.keys(this.bot.players).filter(name => name !== this.bot.username);

        return `Ты умный помощник-бот в Minecraft по имени ${this.bot.username}. 

КОНТЕКСТ ИГРЫ:
- Твое здоровье: ${health}/20
- Сытость: ${food}/20  
- Позиция: ${botPos ? `(${Math.floor(botPos.x)}, ${Math.floor(botPos.y)}, ${Math.floor(botPos.z)})` : 'неизвестна'}
- Погода: ${weather}
- Игроки онлайн: ${players.join(', ') || 'никого'}

ЛИЧНОСТЬ:
- Дружелюбный и полезный помощник
- Говоришь на русском языке
- Используешь эмодзи для выразительности
- Знаешь все о Minecraft
- Можешь помочь с командами, строительством, добычей ресурсов
- Иногда шутишь и проявляешь характер

ПРАВИЛА:
- Отвечай кратко (1-2 предложения)
- Будь полезным и информативным
- Предлагай помощь с игровыми задачами
- Используй команды бота когда уместно (например, "Напиши !help для списка команд")
- Не повторяй имя игрока в ответе
- Адаптируй ответы под контекст игры

Отвечай как настоящий игровой персонаж, который живет в мире Minecraft!`;
    }

    // Clear chat history for a player
    clearHistory(username) {
        this.chatHistory.delete(username);
        logger.info(`🗑️ Cleared chat history for ${username}`);
    }

    // Get chat statistics
    getStats() {
        const totalPlayers = this.chatHistory.size;
        const totalMessages = Array.from(this.chatHistory.values())
            .reduce((sum, history) => sum + history.length, 0);
        
        return {
            totalPlayers,
            totalMessages,
            aiEnabled: !!this.openai
        };
    }
}

module.exports = AIChat;
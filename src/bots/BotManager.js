const MinecraftBot = require('./MinecraftBot');
const logger = require('../utils/logger');

class BotManager {
    constructor() {
        this.bots = new Map();
        this.config = {
            host: process.env.MINECRAFT_HOST || 'localhost',
            port: parseInt(process.env.MINECRAFT_PORT) || 25565,
            version: process.env.MINECRAFT_VERSION || '1.21.1',
            username: process.env.BOT_USERNAME || 'HelperBot',
            password: process.env.BOT_PASSWORD || undefined,
            auth: process.env.BOT_AUTH || 'offline'
        };
    }

    async initialize() {
        logger.info('🚀 Initializing Bot Manager...');
        
        // Create primary bot
        const primaryBot = new MinecraftBot('primary', this.config);
        await this.addBot(primaryBot);
        
        logger.info('✅ Bot Manager initialized successfully');
    }

    async addBot(bot) {
        try {
            await bot.connect();
            this.bots.set(bot.id, bot);
            logger.info(`✅ Bot ${bot.id} connected successfully`);
        } catch (error) {
            logger.error(`❌ Failed to connect bot ${bot.id}:`, error);
            throw error;
        }
    }

    async removeBot(botId) {
        const bot = this.bots.get(botId);
        if (bot) {
            await bot.disconnect();
            this.bots.delete(botId);
            logger.info(`📴 Bot ${botId} disconnected`);
        }
    }

    async createAdditionalBot(username) {
        const botConfig = {
            ...this.config,
            username: username
        };
        
        const bot = new MinecraftBot(username, botConfig);
        await this.addBot(bot);
        return bot;
    }

    getBots() {
        return Array.from(this.bots.values());
    }

    getBot(botId) {
        return this.bots.get(botId);
    }

    async shutdown() {
        logger.info('📴 Shutting down all bots...');
        
        const shutdownPromises = Array.from(this.bots.values()).map(bot => 
            bot.disconnect().catch(err => 
                logger.error(`Error disconnecting bot ${bot.id}:`, err)
            )
        );
        
        await Promise.all(shutdownPromises);
        this.bots.clear();
        
        logger.info('✅ All bots shut down successfully');
    }
}

module.exports = BotManager;
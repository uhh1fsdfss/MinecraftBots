const dotenv = require('dotenv');
const BotManager = require('./bots/BotManager');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

async function main() {
    try {
        logger.info('🤖 Starting Minecraft Bot System...');
        
        const botManager = new BotManager();
        await botManager.initialize();
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('📴 Shutting down bots...');
            await botManager.shutdown();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            logger.info('📴 Shutting down bots...');
            await botManager.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        logger.error('❌ Failed to start bot system:', error);
        process.exit(1);
    }
}

main();
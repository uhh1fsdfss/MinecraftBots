/**
 * Basic usage example for Minecraft Bot
 * Базовый пример использования Minecraft бота
 */

const BotManager = require('../src/bots/BotManager');

async function basicExample() {
    console.log('🤖 Basic Minecraft Bot Example');
    console.log('==============================');

    try {
        // Create bot manager
        const botManager = new BotManager();
        
        // Initialize with custom config
        botManager.config = {
            host: 'localhost',
            port: 25565,
            version: '1.21.1',
            username: 'ExampleBot',
            auth: 'offline'
        };

        // Initialize bot
        await botManager.initialize();
        console.log('✅ Bot connected successfully!');

        // Get the primary bot
        const bot = botManager.getBot('primary');
        
        if (bot && bot.bot) {
            // Set up custom event handlers
            bot.bot.on('chat', (username, message) => {
                console.log(`💬 ${username}: ${message}`);
                
                // Simple auto-responses
                if (message.includes('hello')) {
                    bot.bot.chat(`Hello ${username}! 👋`);
                }
                
                if (message.includes('time')) {
                    const time = bot.bot.time.timeOfDay;
                    const hours = Math.floor(time / 1000) + 6;
                    const minutes = Math.floor((time % 1000) / 1000 * 60);
                    bot.bot.chat(`🕐 Game time: ${hours % 24}:${minutes.toString().padStart(2, '0')}`);
                }
            });

            // Demonstrate bot capabilities
            setTimeout(() => {
                bot.bot.chat('🤖 Example bot is online! Try saying "hello" or "time"');
            }, 2000);

            // Auto-announce every 5 minutes
            setInterval(() => {
                bot.bot.chat('💡 I\'m still here and ready to help!');
            }, 5 * 60 * 1000);
        }

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n📴 Shutting down example bot...');
            await botManager.shutdown();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Example failed:', error);
        process.exit(1);
    }
}

// Run the example
if (require.main === module) {
    basicExample();
}

module.exports = basicExample;
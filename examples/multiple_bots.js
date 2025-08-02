/**
 * Multiple bots example
 * Пример с несколькими ботами
 */

const BotManager = require('../src/bots/BotManager');

async function multipleBots() {
    console.log('🤖 Multiple Minecraft Bots Example');
    console.log('==================================');

    try {
        const botManager = new BotManager();
        
        // Initialize primary bot
        await botManager.initialize();
        console.log('✅ Primary bot connected');

        // Create additional bots
        const botNames = ['WorkerBot', 'GuardBot', 'BuilderBot'];
        
        for (const name of botNames) {
            try {
                await botManager.createAdditionalBot(name);
                console.log(`✅ ${name} connected`);
                
                // Small delay between connections
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`❌ Failed to connect ${name}:`, error.message);
            }
        }

        // Assign roles to bots
        const bots = botManager.getBots();
        
        bots.forEach((bot, index) => {
            if (!bot.bot) return;
            
            switch (index) {
                case 0: // Primary bot - coordinator
                    bot.bot.chat('🎯 I\'m the coordinator bot. I manage the team!');
                    setupCoordinatorBot(bot);
                    break;
                    
                case 1: // Worker bot - mining and gathering
                    bot.bot.chat('⛏️ I\'m the worker bot. I mine and gather resources!');
                    setupWorkerBot(bot);
                    break;
                    
                case 2: // Guard bot - protection
                    bot.bot.chat('🛡️ I\'m the guard bot. I protect the area!');
                    setupGuardBot(bot);
                    break;
                    
                case 3: // Builder bot - construction
                    bot.bot.chat('🏗️ I\'m the builder bot. I construct buildings!');
                    setupBuilderBot(bot);
                    break;
            }
        });

        // Team coordination
        setInterval(() => {
            const activeBots = bots.filter(bot => bot.isConnected).length;
            console.log(`📊 Team status: ${activeBots}/${bots.length} bots active`);
        }, 30000);

        // Handle shutdown
        process.on('SIGINT', async () => {
            console.log('\n📴 Shutting down bot team...');
            await botManager.shutdown();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Multiple bots example failed:', error);
        process.exit(1);
    }
}

function setupCoordinatorBot(bot) {
    bot.bot.on('chat', (username, message) => {
        if (username === bot.bot.username) return;
        
        // Coordinate team actions
        if (message.includes('!team status')) {
            bot.bot.chat('📊 Team is operational! All bots ready for commands.');
        }
        
        if (message.includes('!team gather')) {
            bot.bot.chat('⛏️ Team, start gathering resources!');
            // Could send commands to other bots here
        }
    });
}

function setupWorkerBot(bot) {
    // Auto-mining behavior
    setInterval(async () => {
        if (!bot.isConnected) return;
        
        try {
            // Look for nearby resources
            const blocks = bot.bot.findBlocks({
                matching: (block) => {
                    return block.name.includes('coal_ore') || 
                           block.name.includes('iron_ore') ||
                           block.name.includes('stone');
                },
                maxDistance: 16,
                count: 1
            });
            
            if (blocks.length > 0) {
                await bot.bot.collectBlock.collect(blocks[0]);
                bot.bot.chat('⛏️ Found and collected resources!');
            }
        } catch (error) {
            // Silently handle mining errors
        }
    }, 30000);
}

function setupGuardBot(bot) {
    // Auto-guard behavior
    setInterval(() => {
        if (!bot.isConnected) return;
        
        const nearbyMobs = Object.values(bot.bot.entities).filter(entity => {
            if (!entity.mobType || entity.mobType === 'player') return false;
            
            const distance = entity.position.distanceTo(bot.bot.entity.position);
            return distance <= 20 && (
                entity.mobType === 'zombie' ||
                entity.mobType === 'skeleton' ||
                entity.mobType === 'spider' ||
                entity.mobType === 'creeper'
            );
        });

        if (nearbyMobs.length > 0) {
            bot.bot.chat(`🛡️ Detected ${nearbyMobs.length} hostile mobs nearby!`);
            bot.bot.pvp.attack(nearbyMobs[0]);
        }
    }, 5000);
}

function setupBuilderBot(bot) {
    bot.bot.on('chat', (username, message) => {
        if (username === bot.bot.username) return;
        
        // Respond to building requests
        if (message.includes('build') && message.includes('!')) {
            bot.bot.chat('🏗️ Builder bot ready! What should I construct?');
        }
    });
}

// Run the example
if (require.main === module) {
    multipleBots();
}

module.exports = multipleBots;
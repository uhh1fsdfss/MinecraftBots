const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const collectBlock = require('mineflayer-collectblock');
const pvp = require('mineflayer-pvp');
const armorManager = require('mineflayer-armor-manager');

const CommandHandler = require('../commands/CommandHandler');
const AIChat = require('../ai/AIChat');
const logger = require('../utils/logger');

class MinecraftBot {
    constructor(id, config) {
        this.id = id;
        this.config = config;
        this.bot = null;
        this.commandHandler = null;
        this.aiChat = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async connect() {
        try {
            logger.info(`🔌 Connecting bot ${this.id} to ${this.config.host}:${this.config.port}`);
            
            this.bot = mineflayer.createBot({
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                password: this.config.password,
                auth: this.config.auth,
                version: this.config.version
            });

            // Load plugins
            this.bot.loadPlugin(pathfinder);
            this.bot.loadPlugin(collectBlock);
            this.bot.loadPlugin(pvp);
            this.bot.loadPlugin(armorManager);

            // Initialize components
            this.commandHandler = new CommandHandler(this.bot);
            this.aiChat = new AIChat(this.bot);

            // Set up event handlers
            this.setupEventHandlers();

            // Wait for spawn
            await new Promise((resolve, reject) => {
                this.bot.once('spawn', resolve);
                this.bot.once('error', reject);
                
                setTimeout(() => reject(new Error('Connection timeout')), 30000);
            });

            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            logger.info(`✅ Bot ${this.id} spawned successfully`);
            
        } catch (error) {
            logger.error(`❌ Failed to connect bot ${this.id}:`, error);
            throw error;
        }
    }

    setupEventHandlers() {
        // Connection events
        this.bot.on('login', () => {
            logger.info(`🎮 Bot ${this.id} logged in`);
        });

        this.bot.on('spawn', () => {
            logger.info(`🌍 Bot ${this.id} spawned in world`);
            
            // Set up pathfinding
            const mcData = require('minecraft-data')(this.bot.version);
            const defaultMove = new Movements(this.bot, mcData);
            this.bot.pathfinder.setMovements(defaultMove);
            
            // Send welcome message
            this.bot.chat('🤖 Привет! Я умный помощник. Используйте !help для списка команд.');
        });

        this.bot.on('error', (err) => {
            logger.error(`❌ Bot ${this.id} error:`, err);
            this.handleReconnect();
        });

        this.bot.on('end', () => {
            logger.warn(`📴 Bot ${this.id} disconnected`);
            this.isConnected = false;
            this.handleReconnect();
        });

        this.bot.on('kicked', (reason) => {
            logger.warn(`👢 Bot ${this.id} was kicked: ${reason}`);
            this.handleReconnect();
        });

        // Chat events
        this.bot.on('chat', (username, message) => {
            if (username === this.bot.username) return;
            
            logger.info(`💬 ${username}: ${message}`);
            
            // Handle commands
            if (message.startsWith('!')) {
                this.commandHandler.handleCommand(username, message);
            } else {
                // Handle AI chat
                this.aiChat.handleMessage(username, message);
            }
        });

        // Player events
        this.bot.on('playerJoined', (player) => {
            logger.info(`👋 ${player.username} joined the game`);
            setTimeout(() => {
                this.bot.chat(`Привет, ${player.username}! 👋 Я ваш помощник. Напишите !help для списка команд.`);
            }, 2000);
        });

        this.bot.on('playerLeft', (player) => {
            logger.info(`👋 ${player.username} left the game`);
        });

        // Health and food management
        this.bot.on('health', () => {
            if (this.bot.health < 10) {
                logger.warn(`⚠️ Bot ${this.id} health is low: ${this.bot.health}`);
                this.bot.chat('⚠️ Мое здоровье на исходе! Нужна помощь!');
            }
        });

        this.bot.on('death', () => {
            logger.warn(`💀 Bot ${this.id} died`);
            this.bot.chat('💀 Я погиб! Возрождаюсь...');
        });
    }

    async handleReconnect() {
        if (!process.env.AUTO_RECONNECT || process.env.AUTO_RECONNECT === 'false') {
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error(`❌ Bot ${this.id} exceeded max reconnection attempts`);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        logger.info(`🔄 Attempting to reconnect bot ${this.id} in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                logger.error(`❌ Reconnection failed for bot ${this.id}:`, error);
            }
        }, delay);
    }

    async disconnect() {
        if (this.bot && this.isConnected) {
            this.bot.chat('👋 До свидания! Отключаюсь...');
            this.bot.quit();
            this.isConnected = false;
        }
    }

    // Utility methods for bot actions
    async goTo(x, y, z) {
        if (!this.bot || !this.isConnected) return false;
        
        try {
            const goal = new goals.GoalBlock(x, y, z);
            await this.bot.pathfinder.goto(goal);
            return true;
        } catch (error) {
            logger.error(`❌ Failed to go to ${x}, ${y}, ${z}:`, error);
            return false;
        }
    }

    async followPlayer(playerName) {
        if (!this.bot || !this.isConnected) return false;
        
        const player = this.bot.players[playerName];
        if (!player || !player.entity) {
            this.bot.chat(`❌ Не могу найти игрока ${playerName}`);
            return false;
        }

        try {
            const goal = new goals.GoalFollow(player.entity, 2);
            this.bot.pathfinder.setGoal(goal, true);
            this.bot.chat(`✅ Следую за ${playerName}`);
            return true;
        } catch (error) {
            logger.error(`❌ Failed to follow ${playerName}:`, error);
            return false;
        }
    }

    async stopFollowing() {
        if (!this.bot || !this.isConnected) return;
        
        this.bot.pathfinder.setGoal(null);
        this.bot.chat('⏹️ Прекратил следование');
    }
}

module.exports = MinecraftBot;
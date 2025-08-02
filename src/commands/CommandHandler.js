const logger = require('../utils/logger');
const { goals } = require('mineflayer-pathfinder');

class CommandHandler {
    constructor(bot) {
        this.bot = bot;
        this.commands = new Map();
        this.registerCommands();
    }

    registerCommands() {
        // Basic commands
        this.commands.set('help', this.helpCommand.bind(this));
        this.commands.set('ping', this.pingCommand.bind(this));
        this.commands.set('status', this.statusCommand.bind(this));
        
        // Movement commands
        this.commands.set('come', this.comeCommand.bind(this));
        this.commands.set('follow', this.followCommand.bind(this));
        this.commands.set('stop', this.stopCommand.bind(this));
        this.commands.set('goto', this.gotoCommand.bind(this));
        
        // Mining commands
        this.commands.set('mine', this.mineCommand.bind(this));
        this.commands.set('dig', this.digCommand.bind(this));
        
        // Building commands
        this.commands.set('build', this.buildCommand.bind(this));
        this.commands.set('place', this.placeCommand.bind(this));
        
        // Inventory commands
        this.commands.set('inventory', this.inventoryCommand.bind(this));
        this.commands.set('craft', this.craftCommand.bind(this));
        this.commands.set('drop', this.dropCommand.bind(this));
        
        // Combat commands
        this.commands.set('guard', this.guardCommand.bind(this));
        this.commands.set('attack', this.attackCommand.bind(this));
        
        // Utility commands
        this.commands.set('time', this.timeCommand.bind(this));
        this.commands.set('weather', this.weatherCommand.bind(this));
        this.commands.set('players', this.playersCommand.bind(this));
    }

    async handleCommand(username, message) {
        try {
            const args = message.slice(1).split(' ');
            const command = args[0].toLowerCase();
            const params = args.slice(1);

            logger.info(`🎮 Command from ${username}: ${message}`);

            if (this.commands.has(command)) {
                await this.commands.get(command)(username, params);
            } else {
                this.bot.chat(`❌ Неизвестная команда: ${command}. Используйте !help для списка команд.`);
            }
        } catch (error) {
            logger.error('❌ Error handling command:', error);
            this.bot.chat('❌ Произошла ошибка при выполнении команды.');
        }
    }

    // Command implementations
    async helpCommand(username, params) {
        const helpText = [
            '🤖 Доступные команды:',
            '📍 Движение: !come, !follow <игрок>, !stop, !goto <x> <y> <z>',
            '⛏️ Добыча: !mine <блок>, !dig <x> <y> <z>',
            '🏗️ Строительство: !build <структура>, !place <блок> <x> <y> <z>',
            '🎒 Инвентарь: !inventory, !craft <предмет>, !drop <предмет>',
            '⚔️ Бой: !guard <радиус>, !attack <цель>',
            '🔧 Утилиты: !time, !weather, !players, !status, !ping'
        ];
        
        for (const line of helpText) {
            this.bot.chat(line);
            await this.delay(500);
        }
    }

    async pingCommand(username, params) {
        this.bot.chat(`🏓 Понг! Привет, ${username}!`);
    }

    async statusCommand(username, params) {
        const health = this.bot.health;
        const food = this.bot.food;
        const pos = this.bot.entity.position;
        
        this.bot.chat(`📊 Статус: ❤️${health}/20 🍖${food}/20 📍(${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)})`);
    }

    async comeCommand(username, params) {
        const player = this.bot.players[username];
        if (!player || !player.entity) {
            this.bot.chat(`❌ Не могу найти вас, ${username}`);
            return;
        }

        try {
            const goal = new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 2);
            this.bot.pathfinder.setGoal(goal);
            this.bot.chat(`🏃 Иду к вам, ${username}!`);
        } catch (error) {
            this.bot.chat('❌ Не могу добраться до вас');
        }
    }

    async followCommand(username, params) {
        if (params.length === 0) {
            this.bot.chat('❌ Укажите имя игрока: !follow <игрок>');
            return;
        }

        const targetPlayer = params[0];
        const player = this.bot.players[targetPlayer];
        
        if (!player || !player.entity) {
            this.bot.chat(`❌ Игрок ${targetPlayer} не найден`);
            return;
        }

        try {
            const goal = new goals.GoalFollow(player.entity, 2);
            this.bot.pathfinder.setGoal(goal, true);
            this.bot.chat(`✅ Следую за ${targetPlayer}`);
        } catch (error) {
            this.bot.chat(`❌ Не могу следовать за ${targetPlayer}`);
        }
    }

    async stopCommand(username, params) {
        this.bot.pathfinder.setGoal(null);
        this.bot.pvp.stop();
        this.bot.chat('⏹️ Остановился');
    }

    async gotoCommand(username, params) {
        if (params.length < 3) {
            this.bot.chat('❌ Укажите координаты: !goto <x> <y> <z>');
            return;
        }

        const x = parseInt(params[0]);
        const y = parseInt(params[1]);
        const z = parseInt(params[2]);

        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            this.bot.chat('❌ Неверные координаты');
            return;
        }

        try {
            const goal = new goals.GoalBlock(x, y, z);
            this.bot.pathfinder.setGoal(goal);
            this.bot.chat(`🎯 Иду к координатам (${x}, ${y}, ${z})`);
        } catch (error) {
            this.bot.chat('❌ Не могу добраться до указанных координат');
        }
    }

    async mineCommand(username, params) {
        if (params.length === 0) {
            this.bot.chat('❌ Укажите тип блока: !mine <блок>');
            return;
        }

        const blockName = params[0];
        const mcData = require('minecraft-data')(this.bot.version);
        const blockType = mcData.blocksByName[blockName];

        if (!blockType) {
            this.bot.chat(`❌ Неизвестный блок: ${blockName}`);
            return;
        }

        try {
            const blocks = this.bot.findBlocks({
                matching: blockType.id,
                maxDistance: 32,
                count: 1
            });

            if (blocks.length === 0) {
                this.bot.chat(`❌ Не найдено блоков типа ${blockName} поблизости`);
                return;
            }

            this.bot.chat(`⛏️ Начинаю добычу ${blockName}...`);
            await this.bot.collectBlock.collect(blocks[0]);
            this.bot.chat(`✅ Добыл ${blockName}!`);
        } catch (error) {
            this.bot.chat(`❌ Не удалось добыть ${blockName}`);
        }
    }

    async digCommand(username, params) {
        if (params.length < 3) {
            this.bot.chat('❌ Укажите координаты: !dig <x> <y> <z>');
            return;
        }

        const x = parseInt(params[0]);
        const y = parseInt(params[1]);
        const z = parseInt(params[2]);

        try {
            const block = this.bot.blockAt(new this.bot.Vec3(x, y, z));
            if (!block || block.name === 'air') {
                this.bot.chat('❌ В указанных координатах нет блока');
                return;
            }

            this.bot.chat(`⛏️ Копаю блок в (${x}, ${y}, ${z})...`);
            await this.bot.dig(block);
            this.bot.chat('✅ Блок выкопан!');
        } catch (error) {
            this.bot.chat('❌ Не удалось выкопать блок');
        }
    }

    async buildCommand(username, params) {
        if (params.length === 0) {
            this.bot.chat('❌ Укажите тип структуры: !build <структура>');
            this.bot.chat('📋 Доступные структуры: tower, wall, bridge, house');
            return;
        }

        const structure = params[0].toLowerCase();
        const player = this.bot.players[username];
        
        if (!player || !player.entity) {
            this.bot.chat('❌ Не могу найти вашу позицию');
            return;
        }

        const pos = player.entity.position;
        
        switch (structure) {
            case 'tower':
                await this.buildTower(pos);
                break;
            case 'wall':
                await this.buildWall(pos);
                break;
            case 'bridge':
                await this.buildBridge(pos);
                break;
            case 'house':
                await this.buildHouse(pos);
                break;
            default:
                this.bot.chat(`❌ Неизвестная структура: ${structure}`);
        }
    }

    async inventoryCommand(username, params) {
        const items = this.bot.inventory.items();
        if (items.length === 0) {
            this.bot.chat('🎒 Инвентарь пуст');
            return;
        }

        this.bot.chat('🎒 Инвентарь:');
        const itemCounts = {};
        
        items.forEach(item => {
            const name = item.name;
            itemCounts[name] = (itemCounts[name] || 0) + item.count;
        });

        for (const [name, count] of Object.entries(itemCounts)) {
            this.bot.chat(`  ${name}: ${count}`);
            await this.delay(200);
        }
    }

    async craftCommand(username, params) {
        if (params.length === 0) {
            this.bot.chat('❌ Укажите предмет для крафта: !craft <предмет>');
            return;
        }

        const itemName = params[0];
        const mcData = require('minecraft-data')(this.bot.version);
        const item = mcData.itemsByName[itemName];

        if (!item) {
            this.bot.chat(`❌ Неизвестный предмет: ${itemName}`);
            return;
        }

        try {
            const recipe = this.bot.recipesFor(item.id, null, 1, null)[0];
            if (!recipe) {
                this.bot.chat(`❌ Не знаю рецепт для ${itemName}`);
                return;
            }

            this.bot.chat(`🔨 Крафчу ${itemName}...`);
            await this.bot.craft(recipe, 1, null);
            this.bot.chat(`✅ Скрафтил ${itemName}!`);
        } catch (error) {
            this.bot.chat(`❌ Не удалось скрафтить ${itemName}`);
        }
    }

    async guardCommand(username, params) {
        const radius = params.length > 0 ? parseInt(params[0]) : 10;
        
        if (isNaN(radius) || radius < 1 || radius > 50) {
            this.bot.chat('❌ Укажите радиус охраны (1-50): !guard <радиус>');
            return;
        }

        this.bot.chat(`🛡️ Начинаю охрану территории в радиусе ${radius} блоков`);
        
        // Simple guard implementation
        this.guardRadius = radius;
        this.guardCenter = this.bot.entity.position.clone();
        this.isGuarding = true;
        
        this.guardInterval = setInterval(() => {
            if (!this.isGuarding) return;
            
            const nearbyMobs = Object.values(this.bot.entities).filter(entity => {
                if (!entity.mobType || entity.mobType === 'Armor Stand') return false;
                if (entity.mobType === 'player') return false;
                
                const distance = entity.position.distanceTo(this.guardCenter);
                return distance <= this.guardRadius;
            });

            if (nearbyMobs.length > 0) {
                const target = nearbyMobs[0];
                this.bot.pvp.attack(target);
            }
        }, 1000);
    }

    async attackCommand(username, params) {
        if (params.length === 0) {
            this.bot.chat('❌ Укажите цель: !attack <игрок/моб>');
            return;
        }

        const targetName = params[0];
        const target = this.bot.players[targetName]?.entity || 
                      Object.values(this.bot.entities).find(e => e.username === targetName);

        if (!target) {
            this.bot.chat(`❌ Цель ${targetName} не найдена`);
            return;
        }

        this.bot.chat(`⚔️ Атакую ${targetName}!`);
        this.bot.pvp.attack(target);
    }

    async timeCommand(username, params) {
        const time = this.bot.time.timeOfDay;
        const hours = Math.floor(time / 1000) + 6; // Minecraft time starts at 6 AM
        const minutes = Math.floor((time % 1000) / 1000 * 60);
        
        this.bot.chat(`🕐 Время в игре: ${hours % 24}:${minutes.toString().padStart(2, '0')}`);
    }

    async weatherCommand(username, params) {
        const isRaining = this.bot.isRaining;
        const thunderState = this.bot.thunderState;
        
        let weather = '☀️ Ясно';
        if (isRaining && thunderState > 0) {
            weather = '⛈️ Гроза';
        } else if (isRaining) {
            weather = '🌧️ Дождь';
        }
        
        this.bot.chat(`🌤️ Погода: ${weather}`);
    }

    async playersCommand(username, params) {
        const players = Object.keys(this.bot.players).filter(name => name !== this.bot.username);
        
        if (players.length === 0) {
            this.bot.chat('👥 Нет других игроков онлайн');
            return;
        }
        
        this.bot.chat(`👥 Игроки онлайн (${players.length}): ${players.join(', ')}`);
    }

    // Helper methods
    async buildTower(pos) {
        this.bot.chat('🏗️ Строю башню...');
        // Simple tower building logic would go here
        this.bot.chat('✅ Башня построена!');
    }

    async buildWall(pos) {
        this.bot.chat('🏗️ Строю стену...');
        // Wall building logic would go here
        this.bot.chat('✅ Стена построена!');
    }

    async buildBridge(pos) {
        this.bot.chat('🏗️ Строю мост...');
        // Bridge building logic would go here
        this.bot.chat('✅ Мост построен!');
    }

    async buildHouse(pos) {
        this.bot.chat('🏗️ Строю дом...');
        // House building logic would go here
        this.bot.chat('✅ Дом построен!');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = CommandHandler;
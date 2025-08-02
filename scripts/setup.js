#!/usr/bin/env node

/**
 * Interactive setup script for Minecraft Bot
 * Интерактивная настройка Minecraft бота
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('🤖 Minecraft Bot Setup');
    console.log('======================');
    console.log('');

    try {
        // Server configuration
        console.log('📡 Server Configuration:');
        const host = await question('Minecraft server IP (localhost): ') || 'localhost';
        const port = await question('Server port (25565): ') || '25565';
        const version = await question('Minecraft version (1.21.1): ') || '1.21.1';
        console.log('');

        // Bot configuration
        console.log('🤖 Bot Configuration:');
        const username = await question('Bot username (HelperBot): ') || 'HelperBot';
        const auth = await question('Auth type (offline/microsoft) [offline]: ') || 'offline';
        console.log('');

        // AI configuration
        console.log('🧠 AI Configuration (optional):');
        console.log('💡 Get your API key from: https://platform.openai.com/api-keys');
        const openaiKey = await question('OpenAI API key (leave empty to skip): ') || 'your_openai_api_key_here';
        const model = await question('OpenAI model (gpt-3.5-turbo): ') || 'gpt-3.5-turbo';
        console.log('');

        // Advanced settings
        console.log('⚙️ Advanced Settings:');
        const maxHistory = await question('Max chat history (50): ') || '50';
        const responseDelay = await question('Response delay ms (1000): ') || '1000';
        const autoReconnect = await question('Auto reconnect (true/false) [true]: ') || 'true';
        console.log('');

        // Create .env file
        const envContent = `# Minecraft Server Configuration
MINECRAFT_HOST=${host}
MINECRAFT_PORT=${port}
MINECRAFT_VERSION=${version}

# Bot Configuration
BOT_USERNAME=${username}
BOT_AUTH=${auth}

# OpenAI Configuration (for AI chat)
OPENAI_API_KEY=${openaiKey}
OPENAI_MODEL=${model}

# Bot Behavior Settings
MAX_CHAT_HISTORY=${maxHistory}
RESPONSE_DELAY=${responseDelay}
AUTO_RECONNECT=${autoReconnect}

# Web Interface (optional)
WEB_PORT=3000
ENABLE_WEB_INTERFACE=false

# Logging
LOG_LEVEL=info
LOG_FILE=logs/bot.log
`;

        fs.writeFileSync('.env', envContent);
        console.log('✅ Configuration saved to .env file');

        // Create logs directory
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
            console.log('✅ Created logs directory');
        }

        // Summary
        console.log('');
        console.log('🎉 Setup completed successfully!');
        console.log('');
        console.log('📋 Configuration Summary:');
        console.log(`   Server: ${host}:${port}`);
        console.log(`   Bot: ${username}`);
        console.log(`   Version: ${version}`);
        console.log(`   AI Chat: ${openaiKey !== 'your_openai_api_key_here' ? '✅ Enabled' : '❌ Disabled'}`);
        console.log('');
        console.log('🚀 Next steps:');
        console.log('   1. Make sure your Minecraft server is running');
        console.log('   2. Run: npm start');
        console.log('   3. Check the bot joins your server');
        console.log('   4. Try commands like !help in game chat');
        console.log('');

        if (openaiKey === 'your_openai_api_key_here') {
            console.log('💡 To enable AI chat:');
            console.log('   1. Get API key from https://platform.openai.com/api-keys');
            console.log('   2. Edit .env file and replace OPENAI_API_KEY value');
            console.log('   3. Restart the bot');
            console.log('');
        }

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

main();
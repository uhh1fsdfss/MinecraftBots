#!/usr/bin/env python3
"""
Google Colab setup script for Minecraft Bot
Автоматическая настройка бота в Google Colab
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def install_nodejs():
    """Установка Node.js в Google Colab"""
    print("🔧 Устанавливаем Node.js...")
    
    commands = [
        "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
        "sudo apt-get install -y nodejs"
    ]
    
    for cmd in commands:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Ошибка выполнения: {cmd}")
            print(result.stderr)
            return False
    
    print("✅ Node.js установлен успешно")
    return True

def clone_repository():
    """Клонирование репозитория"""
    print("📦 Клонируем репозиторий...")
    
    repo_url = "https://github.com/uhh1fsdfss/MinecraftBots.git"
    
    if os.path.exists("MinecraftBots"):
        print("📁 Репозиторий уже существует, обновляем...")
        os.chdir("MinecraftBots")
        subprocess.run(["git", "pull"], check=True)
    else:
        subprocess.run(["git", "clone", repo_url], check=True)
        os.chdir("MinecraftBots")
    
    print("✅ Репозиторий готов")

def install_dependencies():
    """Установка npm зависимостей"""
    print("📦 Устанавливаем зависимости...")
    
    result = subprocess.run(["npm", "install"], capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Ошибка установки зависимостей:")
        print(result.stderr)
        return False
    
    print("✅ Зависимости установлены")
    return True

def create_env_file(config):
    """Создание .env файла"""
    print("⚙️ Создаем конфигурацию...")
    
    env_content = f"""# Minecraft Server Configuration
MINECRAFT_HOST={config.get('host', 'localhost')}
MINECRAFT_PORT={config.get('port', 25565)}
MINECRAFT_VERSION={config.get('version', '1.21.1')}

# Bot Configuration
BOT_USERNAME={config.get('username', 'ColabBot')}
BOT_AUTH=offline

# OpenAI Configuration
OPENAI_API_KEY={config.get('openai_key', 'your_openai_api_key_here')}
OPENAI_MODEL=gpt-3.5-turbo

# Bot Settings
MAX_CHAT_HISTORY=30
RESPONSE_DELAY=2000
AUTO_RECONNECT=true
LOG_LEVEL=info
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Конфигурация создана")

def setup_colab_environment():
    """Настройка окружения для Colab"""
    print("🔧 Настраиваем окружение Colab...")
    
    # Создаем директории
    os.makedirs('logs', exist_ok=True)
    
    # Устанавливаем права
    subprocess.run(["chmod", "+x", "src/index.js"], check=False)
    
    print("✅ Окружение настроено")

def main():
    """Основная функция установки"""
    print("🤖 Настройка Minecraft Bot для Google Colab")
    print("=" * 50)
    
    try:
        # Проверяем, что мы в Colab
        if 'google.colab' not in sys.modules:
            print("⚠️ Этот скрипт предназначен для Google Colab")
        
        # Установка Node.js
        if not install_nodejs():
            return False
        
        # Клонирование репозитория
        clone_repository()
        
        # Установка зависимостей
        if not install_dependencies():
            return False
        
        # Настройка окружения
        setup_colab_environment()
        
        print("\n🎉 Установка завершена успешно!")
        print("📋 Следующие шаги:")
        print("1. Настройте конфигурацию бота")
        print("2. Запустите бота командой: npm start")
        print("3. Подключитесь к вашему Minecraft серверу")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка установки: {e}")
        return False

if __name__ == "__main__":
    main()
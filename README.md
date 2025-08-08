### Умные боты Minecraft на Node.js (с Ollama, памятью и Colab)

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/USER/REPO/blob/main/notebooks/colab.ipynb)

[Открыть в Colab](https://colab.research.google.com/github/USER/REPO/blob/main/notebooks/colab.ipynb)

Замените `USER/REPO` на ваш GitHub репозиторий после публикации.

- **Ollama**: планирование действий (сбор, крафт, постройка укрытия, исследование, еда).
- **Память**: сохраняется в Google Drive (на Colab) или локально в `training_data/`.
- **Мульти-боты**: запуск нескольких ботов, авто-имена от LLM.
- **HTTP API**: простой контроль ботов.

#### Быстрый старт локально

```bash
npm install
npm start -- --host localhost --port 25565 --version auto --n 1
```

Опции также через `.env` (см. `.env.example`).

#### Запуск на Colab

- Нажмите кнопку «Открыть в Colab» выше. Ноутбук сделает:
  - Установку Node.js и зависимостей
  - (Опционально) установит и запустит Ollama, скачает модели `llama3.1:8b` и `nomic-embed-text`
  - Смонтирует Google Drive и направит память ботов в Drive
  - Запустит ботов

#### Переменные окружения (ключевые)

- **MC_HOST/MC_PORT**: адрес сервера.
- **MC_VERSION**: `auto` или версия (напр. `1.20.1`).
- **NUM_BOTS**: количество ботов.
- **LLM_MODEL**: модель Ollama, по умолчанию `llama3.1:8b`.
- **MEMORY_DIR**: папка памяти локально.

#### API

- `GET /health` — статус.
- `POST /bots/:name/say { text }` — сказать от имени бота.

#### Примечания
- Для онлайн-серверов со входом через Microsoft задайте `MC_ONLINE_MODE=true` и `MC_USERNAME`/`MC_PASSWORD`.
- Некоторые действия (например, полноценное строительство) реализованы минимально; улучшайте в `src/skills/executeAction.js` и `src/planner/prompt.js`.
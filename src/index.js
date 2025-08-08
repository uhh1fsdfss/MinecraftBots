import 'dotenv/config'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import path from 'node:path'
import fs from 'node:fs'
import { createSmartBot } from './lib/createBot.js'
import { createOllamaClient } from './llm/ollamaClient.js'
import { createMemoryStore } from './memory/memory.js'
import { createControlServer } from './lib/server.js'
import { chooseBotNames } from './llm/nameChooser.js'

const argv = yargs(hideBin(process.argv))
  .option('host', { type: 'string', default: process.env.MC_HOST || 'localhost' })
  .option('port', { type: 'number', default: Number(process.env.MC_PORT || 25565) })
  .option('version', { type: 'string', default: process.env.MC_VERSION || 'auto' })
  .option('online', { type: 'boolean', default: process.env.MC_ONLINE_MODE === 'true' })
  .option('username', { type: 'string', default: process.env.MC_USERNAME || '' })
  .option('password', { type: 'string', default: process.env.MC_PASSWORD || '' })
  .option('num', { alias: 'n', type: 'number', default: Number(process.env.NUM_BOTS || 1) })
  .option('model', { type: 'string', default: process.env.LLM_MODEL || 'llama3.1:8b' })
  .option('prefix', { type: 'string', default: process.env.BOT_PREFIX || 'SmartBot' })
  .option('master', { type: 'string', default: process.env.MASTER_USERNAME || 'player' })
  .option('memory', { type: 'string', default: process.env.MEMORY_DIR || './training_data' })
  .option('apiPort', { type: 'number', default: Number(process.env.HTTP_API_PORT || 8787) })
  .help()
  .argv

const isColab = !!process.env.COLAB_RELEASE_TAG || process.env.KAGGLE_KERNEL_RUN_TYPE === 'Interactive' || process.env.GOOGLE_COLAB === '1'

// Memory path: Google Drive if mounted in Colab, else local
const driveRoot = '/content/drive/MyDrive'
const memoryDir = isColab && fs.existsSync(driveRoot)
  ? path.join(driveRoot, 'smart-minecraft-bots', 'memory')
  : path.resolve(argv.memory)

fs.mkdirSync(memoryDir, { recursive: true })

const llm = createOllamaClient({
  baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
  model: argv.model,
  temperature: Number(process.env.LLM_TEMPERATURE || 0.3),
})

const memory = createMemoryStore({
  baseDir: memoryDir,
  useEmbeddings: (process.env.USE_EMBEDDINGS || 'true') === 'true',
  ollama: llm,
})

async function main() {
  const botNames = await chooseBotNames({
    llm,
    count: argv.num,
    prefix: argv.prefix,
  })

  const bots = []
  for (let i = 0; i < argv.num; i++) {
    const name = botNames[i] || `${argv.prefix}-${i + 1}`
    const bot = await createSmartBot({
      host: argv.host,
      port: argv.port,
      version: argv.version,
      onlineMode: argv.username ? true : argv.online,
      username: argv.username || `${name}`,
      password: argv.password || undefined,
      masterUsername: argv.master,
      llm,
      memory,
      botId: name,
    })
    bots.push(bot)
  }

  createControlServer({ bots, port: argv.apiPort, llm, memory })

  process.on('SIGINT', async () => {
    console.log('\nShutting down...')
    await Promise.allSettled(bots.map(b => b.quit('Shutdown')))
    process.exit(0)
  })
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
import mineflayer from 'mineflayer'
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
import collectBlockModule from 'mineflayer-collectblock'
import toolModule from 'mineflayer-tool'
import minecraftData from 'minecraft-data'
import { planAndExecute } from '../planner/planAndExecute.js'

export async function createSmartBot(options) {
  const {
    host, port, version, onlineMode,
    username, password,
    masterUsername,
    llm, memory,
    botId,
  } = options

  const bot = mineflayer.createBot({
    host,
    port,
    username,
    password,
    version: version === 'auto' ? false : version,
    auth: onlineMode ? 'microsoft' : 'offline',
    hideErrors: false,
  })

  bot.loadPlugin(pathfinder)
  const collectPlugin = collectBlockModule?.plugin || collectBlockModule
  const toolPlugin = toolModule?.plugin || toolModule
  if (collectPlugin) bot.loadPlugin(collectPlugin)
  if (toolPlugin) bot.loadPlugin(toolPlugin)

  let mcData
  bot.once('spawn', () => {
    mcData = minecraftData(bot.version)
    const defaultMove = new Movements(bot, mcData)
    defaultMove.allow1by1towers = true
    defaultMove.allowParkour = true
    bot.pathfinder.setMovements(defaultMove)
    console.log(`[${bot.username}] Spawned at`, bot.entity.position)
  })

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return

    const addressed = message.includes(bot.username) || username === masterUsername
    if (!addressed) return

    const command = message.replace(bot.username, '').trim()
    const context = await memory.retrieve({ botId, query: command, limit: 6 })
    const result = await planAndExecute({ bot, llm, memory, botId, userMessage: command, context, mcData })
    bot.chat(result.publicMessage || 'Готово')
  })

  // Periodic autonomous behavior
  const interval = setInterval(async () => {
    try {
      if (!bot.entity?.position) return
      const status = summarizeStatus(bot)
      await planAndExecute({ bot, llm, memory, botId, userMessage: 'autonomous tick', context: [status], mcData })
    } catch (e) {
      // ignore
    }
  }, 30000)

  bot.on('end', () => clearInterval(interval))

  bot.on('kicked', (reason) => console.log(`[${bot.username}] Kicked:`, reason))
  bot.on('error', (err) => console.log(`[${bot.username}] Error:`, err?.message || err))

  return bot
}

function summarizeStatus(bot) {
  const inv = bot.inventory?.items() || []
  const items = inv.map(i => `${i.count}x ${i.displayName}`).join(', ')
  const position = bot.entity?.position
  return {
    type: 'status',
    at: Date.now(),
    position: position ? position.toString() : 'unknown',
    health: bot.health,
    food: bot.food,
    oxygen: bot.oxygenLevel,
    dimension: bot.game?.dimension,
    items,
  }
}
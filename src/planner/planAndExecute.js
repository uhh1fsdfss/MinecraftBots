import { systemPrompt } from './prompt.js'
import { executeAction } from '../skills/executeAction.js'

export async function planAndExecute({ bot, llm, memory, botId, userMessage, context = [], mcData }) {
  const input = {
    user_message: userMessage,
    context,
    observations: {
      position: bot.entity?.position?.toString(),
      health: bot.health,
      food: bot.food,
      dimension: bot.game?.dimension,
      biome: bot.biome?.name,
      timeOfDay: bot.time?.timeOfDay,
    },
  }

  const msg = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(input, null, 2) },
  ]

  const raw = await llm.chat(msg)
  let plan
  try {
    plan = JSON.parse(safeJsonFromText(raw))
  } catch (e) {
    plan = { actions: [{ type: 'say', text: 'Не понял. Скажи проще.' }], memory: [] }
  }

  const results = []
  for (const action of plan.actions || []) {
    const res = await executeAction({ bot, action, mcData })
    results.push(res)
  }

  if (plan.memory && plan.memory.length) {
    await memory.saveMany({ botId, records: plan.memory.map(m => ({
      type: 'experience',
      ...m,
    })) })
  }

  const publicMessage = plan.say || plan.actions?.find(a => a.type === 'say')?.text

  return { plan, results, publicMessage }
}

function safeJsonFromText(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return '{}'
  return text.slice(start, end + 1)
}
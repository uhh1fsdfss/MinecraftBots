import { goals } from 'mineflayer-pathfinder'
import minecraftData from 'minecraft-data'

export async function executeAction({ bot, action, mcData }) {
  switch (action.type) {
    case 'say':
      if (action.text) bot.chat(action.text)
      return { ok: true }
    case 'move_to':
      return moveTo(bot, action)
    case 'collect':
      return collectItem(bot, action)
    case 'craft':
      return craftItem(bot, action)
    case 'explore':
      return explore(bot, action)
    case 'build_shelter':
      return buildShelter(bot)
    case 'eat_if_hungry':
      return eatIfHungry(bot)
    case 'defend_self':
      // simplistic: retreat
      return explore(bot, { radius: 8 })
    default:
      return { ok: false, error: 'unknown action' }
  }
}

async function moveTo(bot, { x, y, z }) {
  if ([x, y, z].some(v => typeof v !== 'number')) return { ok: false, error: 'bad coords' }
  const goal = new goals.GoalBlock(x, y, z)
  await bot.pathfinder.goto(goal)
  return { ok: true }
}

async function collectItem(bot, { item, count = 1 }) {
  const targetId = idByName(bot, item)
  const block = bot.findBlock({ matching: targetId, maxDistance: 64 })
  if (!block) return { ok: false, error: 'block not found' }
  await bot.tool.equipForBlock(block)
  await bot.collectBlock.collect(block, { count })
  return { ok: true }
}

async function craftItem(bot, { item, count = 1 }) {
  const itemId = idByName(bot, item)
  const recipe = bot.recipesFor(itemId, null, 1, null)[0]
  if (!recipe) return { ok: false, error: 'no recipe' }
  const craftingTable = bot.findBlock({ matching: mcdata(bot).blocksByName.crafting_table?.id })
  await bot.craft(recipe, count, craftingTable)
  return { ok: true }
}

async function explore(bot, { radius = 16 }) {
  const origin = bot.entity.position
  const target = origin.offset(randomInt(-radius, radius), 0, randomInt(-radius, radius))
  return moveTo(bot, { x: Math.floor(target.x), y: Math.floor(target.y), z: Math.floor(target.z) })
}

async function buildShelter(bot) {
  const placeable = bot.inventory.items().find(it => it.name.includes('planks') || it.name.includes('cobblestone'))
  if (!placeable) return { ok: false, error: 'no blocks' }
  // Very naive: place a few blocks around
  const base = bot.entity.position.floored()
  const positions = [
    base.offset(1, 0, 0), base.offset(-1, 0, 0), base.offset(0, 0, 1), base.offset(0, 0, -1),
    base.offset(0, 1, 0)
  ]
  await bot.equip(placeable, 'hand')
  for (const pos of positions) {
    const ref = bot.blockAt(pos.offset(0, -1, 0)) || bot.blockAt(base)
    try { await bot.placeBlock(ref, pos.minus(ref.position)) } catch {}
  }
  return { ok: true }
}

async function eatIfHungry(bot) {
  if (bot.food >= 16) return { ok: true }
  const foodItem = bot.inventory.items().find(i => i.name.includes('bread') || i.name.includes('beef') || i.name.includes('porkchop'))
  if (!foodItem) return { ok: false, error: 'no food' }
  await bot.equip(foodItem, 'hand')
  await bot.consume()
  return { ok: true }
}

function idByName(bot, name) {
  const data = mcdata(bot)
  const n = name.replace('minecraft:', '')
  const block = data.blocksByName[n]
  const item = data.itemsByName[n]
  return (block?.id ?? item?.id)
}

function mcdata(bot) { return minecraftData(bot.version) }

function randomInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }
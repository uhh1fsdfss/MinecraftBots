export async function chooseBotNames({ llm, count, prefix }) {
  try {
    const content = await llm.generate(`Предложи ${count} коротких уникальных имен для ботов-ассистентов Minecraft. Формат: JSON массив строк.`)
    const start = content.indexOf('[')
    const end = content.lastIndexOf(']')
    const arr = JSON.parse(content.slice(start, end + 1))
    return arr.map((s, i) => String(s || `${prefix}-${i + 1}`)).slice(0, count)
  } catch {
    return Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`)
  }
}
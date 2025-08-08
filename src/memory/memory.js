import fs from 'node:fs'
import path from 'node:path'

export function createMemoryStore({ baseDir, useEmbeddings = true, ollama }) {
  const recordsDir = path.join(baseDir, 'records')
  const indexFile = path.join(baseDir, 'index.json')
  fs.mkdirSync(recordsDir, { recursive: true })

  let index = []
  if (fs.existsSync(indexFile)) {
    try { index = JSON.parse(fs.readFileSync(indexFile, 'utf-8')) } catch {}
  }

  async function persistIndex() {
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2))
  }

  async function saveMany({ botId, records }) {
    for (const rec of records) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const doc = { id, botId, ...rec }
      fs.writeFileSync(path.join(recordsDir, `${id}.json`), JSON.stringify(doc, null, 2))

      let embedding = null
      if (useEmbeddings && ollama) {
        try {
          const [vec] = await ollama.embed(JSON.stringify(doc))
          embedding = vec
        } catch {}
      }
      index.push({ id, botId, key: rec.key || rec.type || 'note', embedding })
    }
    await persistIndex()
  }

  async function retrieve({ botId, query, limit = 5 }) {
    if (!index.length) return []
    let scored = index.filter(e => e.botId === botId)

    if (useEmbeddings && ollama) {
      try {
        const [q] = await ollama.embed(String(query))
        scored = scored.map(e => ({
          ...e,
          score: e.embedding ? cosine(e.embedding, q) : 0,
        }))
        scored.sort((a, b) => b.score - a.score)
      } catch {
        // fallback to naive
        scored = scored.map(e => ({ ...e, score: Math.random() }))
      }
    }

    const ids = scored.slice(0, limit).map(e => e.id)
    return ids.map(id => JSON.parse(fs.readFileSync(path.join(recordsDir, `${id}.json`), 'utf-8')))
  }

  return { saveMany, retrieve }
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1
  return dot / denom
}
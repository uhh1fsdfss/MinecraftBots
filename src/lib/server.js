import express from 'express'

export function createControlServer({ bots, port, llm, memory }) {
  const app = express()
  app.use(express.json())

  app.get('/health', (req, res) => res.json({ ok: true, bots: bots.map(b => b.username) }))

  app.post('/bots/:name/say', (req, res) => {
    const bot = bots.find(b => b.username === req.params.name)
    if (!bot) return res.status(404).json({ error: 'bot not found' })
    bot.chat(String(req.body.text || ''))
    res.json({ ok: true })
  })

  app.listen(port, () => console.log(`HTTP control on :${port}`))
}
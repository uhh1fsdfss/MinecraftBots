import axios from 'axios'

export function createOllamaClient({ baseUrl, model, temperature = 0.3 }) {
  const http = axios.create({ baseURL: baseUrl, timeout: 60000 })

  return {
    async chat(messages) {
      const res = await http.post('/api/chat', {
        model,
        messages,
        options: { temperature }
      }, { responseType: 'json' })
      // stream is false, we expect a single message
      const content = res.data?.message?.content || res.data?.response || ''
      return content
    },

    async embed(texts) {
      const res = await http.post('/api/embeddings', {
        model: 'nomic-embed-text',
        input: Array.isArray(texts) ? texts : [texts],
      })
      return res.data?.data?.map(d => d.embedding) || []
    },

    async generate(prompt) {
      const res = await http.post('/api/generate', { model, prompt, options: { temperature } })
      return res.data?.response || ''
    },

    model,
    baseUrl,
  }
}
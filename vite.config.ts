import { defineConfig } from 'vite'
import { readInputCases } from './src/reader.ts'

export default defineConfig({
    root: 'src',
    plugins: [{
        name: 'input-files',
        configureServer(server) {
            server.middlewares.use('/api/inputs', async (_request, response) => {
                response.setHeader('Content-Type', 'application/json; charset=utf-8')

                try {
                    response.end(JSON.stringify(await readInputCases()))
                } catch (cause) {
                    response.statusCode = 500
                    const message = cause instanceof Error ? cause.message : 'error desconocido'
                    response.end(JSON.stringify({ error: message }))
                }
            })
        },
    }],
})

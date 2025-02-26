// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import type { Server } from 'http'
import WebSocketPlugin from './src/ws.server'

function websocket(): Plugin {
  return {
    name: 'websocket',
    configureServer(server) {
      if (server.httpServer) {
        WebSocketPlugin(server.httpServer as unknown as Server)
      }
    },
    configurePreviewServer(server) {
      if (server.httpServer) {
        WebSocketPlugin(server.httpServer as unknown as Server)
      }
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), websocket()],
})

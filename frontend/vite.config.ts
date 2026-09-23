import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import {
  CHANNEL_CONFIG_PATH,
  formatChannelConfigErrors,
  loadChannelConfig,
  validateChannelConfig,
} from './scripts/validate-channels.mjs'

const validateChannels = (): PluginOption => ({
  name: 'validate-eeg-channels',
  apply: () => true,
  configResolved() {
    const errors = validateChannelConfig(loadChannelConfig(CHANNEL_CONFIG_PATH))
    if (errors.length > 0) {
      throw new Error(formatChannelConfigErrors(errors))
    }
  },
})

export default defineConfig({
  plugins: [react(), validateChannels()],
  server: {
    port: 5173,
    fs: {
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
    proxy: { '/api': 'http://localhost:8000' },
  },
})

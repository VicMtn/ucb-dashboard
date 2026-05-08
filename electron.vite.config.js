import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// Vite SSR build leaves local CJS require() calls unresolved at runtime,
// so we copy sibling source files that aren't bundled into the output dir.
function copyMainLocalModules() {
  const files = ['db-core.js']
  return {
    name: 'copy-main-local-modules',
    apply: 'build',
    closeBundle() {
      const outDir = resolve('out/main')
      mkdirSync(outDir, { recursive: true })
      for (const f of files) {
        copyFileSync(resolve('src/main', f), resolve(outDir, f))
      }
    },
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMainLocalModules()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [vue(), tailwindcss()],
  },
})

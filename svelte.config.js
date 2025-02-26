// svelte.config.js
import adapter from '@mdd95/sveltekit-adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({
    postcss: true,
  }),

  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true,
      envPrefix: '',
    }),
  },
}
export default config

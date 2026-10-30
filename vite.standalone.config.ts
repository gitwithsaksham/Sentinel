import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { outDir: 'standalone', assetsInlineLimit: 10000000, cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } }
});

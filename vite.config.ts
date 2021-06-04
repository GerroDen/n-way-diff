import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, "web"),
  publicDir: path.resolve(__dirname, "web/public"),
  envDir: __dirname,
  plugins: [vue()],
})

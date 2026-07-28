import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Dr.Rawan/', // اسم المستودع تماماً كما هو على جيت هب
})
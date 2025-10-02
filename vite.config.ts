import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes the environment variables available to the client-side code.
    // Vercel will populate process.env with the project's environment variables.
    // For this to work, set VITE_API_KEY and VITE_HF_API_KEY in your Vercel project settings.
    'process.env.API_KEY': `"${process.env.VITE_API_KEY}"`,
    'process.env.HF_API_KEY': `"${process.env.VITE_HF_API_KEY}"`
  }
})

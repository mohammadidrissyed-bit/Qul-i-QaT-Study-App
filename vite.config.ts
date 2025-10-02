import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes the environment variables available to the client-side code.
    // Vercel will populate process.env with the project's environment variables.
    'process.env.API_KEY': `"${process.env.VITE_API_KEY}"`,
  }
})

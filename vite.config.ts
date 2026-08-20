/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      enabled: true,
      exclude: [
        // excluding sudoCommand from coverage, since the default
        //  test setup mocks it to avoid user interaction
        "sudoCommand.ts"
      ]
    }
  }
})

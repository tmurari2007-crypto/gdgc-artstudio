import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 300000, // 5 minutes to complete the final portion of the download
    testTimeout: 60000,
    globals: true,
  },
});

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5500',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.js',
  },
});

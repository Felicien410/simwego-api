module.exports = {
  testEnvironment: 'node',
  
  // Force sequential execution and proper ordering
  maxWorkers: 1,
  testSequencer: './tests/test-sequencer.js',
  
  // Dossiers de test
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // Couverture de code
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/database.js' // Exclure les fichiers de config DB des tests unitaires
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Configuration Jest
  verbose: true,
  clearMocks: true,
  
  // Timeouts - increased for security tests
  testTimeout: 30000,
  
  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
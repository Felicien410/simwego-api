module.exports = {
  testEnvironment: 'node',
  
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
  
  // Timeouts
  testTimeout: 10000,
  
  // Setup files
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Variables d'environnement pour les tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
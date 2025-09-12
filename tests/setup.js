// Configuration globale pour Jest
process.env.NODE_ENV = 'test';

// Augmenter les timeouts pour les tests d'intégration
jest.setTimeout(10000);

// Mock console.error pour éviter le spam dans les tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0] && 
      typeof args[0] === 'string' && 
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
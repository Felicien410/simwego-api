const TestSequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends TestSequencer {
  sort(tests) {
    // Définir l'ordre spécifique des tests
    const order = [
      '01-api-endpoints.test.js',
      '02-transaction-simulation.test.js', 
      '03-admin-auth.test.js',
      '04-basic-security.test.js'
    ];

    const sortedTests = [];
    
    // Ajouter les tests dans l'ordre défini
    order.forEach(filename => {
      const test = tests.find(t => t.path.includes(filename));
      if (test) {
        sortedTests.push(test);
      }
    });
    
    // Ajouter tout autre test non spécifié à la fin
    tests.forEach(test => {
      if (!sortedTests.includes(test)) {
        sortedTests.push(test);
      }
    });

    console.log('\n📋 Test Execution Order:');
    sortedTests.forEach((test, index) => {
      const filename = test.path.split('/').pop();
      console.log(`   ${index + 1}. ${filename}`);
    });
    console.log('');

    return sortedTests;
  }
}

module.exports = CustomSequencer;
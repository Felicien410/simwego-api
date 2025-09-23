#!/usr/bin/env node
// scripts/fix-security-issues.js - Script pour corriger les problèmes de sécurité critiques

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔒 Fixing critical security issues...\n');

// 1. Générer des secrets JWT sécurisés
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// 2. Fixer le secret JWT par défaut faible
function fixDefaultJWTSecret() {
  console.log('🔑 Fixing default JWT secret...');
  
  const environmentPath = path.join(__dirname, '../src/config/environment.js');
  let environmentContent = fs.readFileSync(environmentPath, 'utf8');
  
  // Supprimer le fallback faible
  environmentContent = environmentContent.replace(
    /jwtSecret:\s*process\.env\.JWT_SECRET\s*\|\|\s*['"][^'"]*['"]/g,
    'jwtSecret: process.env.JWT_SECRET'
  );
  
  environmentContent = environmentContent.replace(
    /adminJwtSecret:\s*process\.env\.ADMIN_JWT_SECRET\s*\|\|\s*process\.env\.JWT_SECRET/g,
    'adminJwtSecret: process.env.ADMIN_JWT_SECRET'
  );
  
  // Ajouter validation des secrets au démarrage
  const validationCode = `
  // Validation des secrets de sécurité au démarrage
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  
  if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.length < 32) {
    throw new Error('ADMIN_JWT_SECRET must be set and at least 32 characters long');
  }
  
  if (!process.env.DB_ENCRYPTION_KEY || process.env.DB_ENCRYPTION_KEY.length < 32) {
    throw new Error('DB_ENCRYPTION_KEY must be set and at least 32 characters long');
  }`;
  
  // Ajouter la validation au début du fichier après les requires
  if (!environmentContent.includes('Validation des secrets de sécurité')) {
    environmentContent = environmentContent.replace(
      /module\.exports\s*=/,
      `${validationCode}\n\nmodule.exports =`
    );
  }
  
  fs.writeFileSync(environmentPath, environmentContent);
  console.log('✅ Fixed default JWT secret and added validation');
}

// 3. Créer un fichier .env.example avec des valeurs sécurisées
function createSecureEnvExample() {
  console.log('📝 Creating secure .env.example...');
  
  const envExampleContent = `# SimWeGo API - Environment Variables
# IMPORTANT: Copy this file to .env and replace ALL values with your own secure secrets

# Security - Generate strong random secrets (minimum 32 characters)
JWT_SECRET=${generateSecureSecret()}
ADMIN_JWT_SECRET=${generateSecureSecret()}
DB_ENCRYPTION_KEY=${generateSecureSecret()}

# Database Configuration
NODE_ENV=production
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-secure-database-password
DATABASE_URL=postgres://user:password@host:port/database?sslmode=no-verify

# Admin Configuration
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD_HASH=generate-with-bcrypt

# Client API Keys (generate unique keys for each client)
CLIENT_TEST_API_KEY=${generateSecureSecret(32)}
CLIENT_REAL_API_KEY=${generateSecureSecret(32)}

# Client Monty Credentials
CLIENT1_MONTY_USERNAME=your-client1-username
CLIENT1_MONTY_PASSWORD=your-client1-password
CLIENT2_MONTY_USERNAME=your-client2-username
CLIENT2_MONTY_PASSWORD=your-client2-password

# Application Configuration
PORT=8080
MONTY_API_BASE_URL=https://resellerapi.montyesim.com

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn-if-using-sentry

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_RATE_LIMIT_MAX=5
`;
  
  const envExamplePath = path.join(__dirname, '../.env.example');
  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✅ Created .env.example with secure defaults');
}

// 4. Ajouter validation d'input sur les controllers proxy
function addInputValidationToControllers() {
  console.log('🛡️ Adding input validation to proxy controllers...');
  
  const controllersDir = path.join(__dirname, '../src/api/v0/controllers');
  const controllers = fs.readdirSync(controllersDir).filter(file => file.endsWith('.js'));
  
  controllers.forEach(controller => {
    const controllerPath = path.join(controllersDir, controller);
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    // Ajouter validation middleware si pas déjà présent
    if (!content.includes('validateProxyInput') && content.includes('ProxyService.proxyToMonty')) {
      const validationMiddleware = `
// Middleware de validation pour les requêtes proxy
function validateProxyInput(req, res, next) {
  const { body, query, params } = req;
  
  // Validation basique des inputs
  const allInputs = { ...body, ...query, ...params };
  
  for (const [key, value] of Object.entries(allInputs)) {
    if (typeof value === 'string') {
      // Vérifier les patterns dangereux
      const dangerousPatterns = [
        /<script[^>]*>.*?<\\/script>/gi,
        /javascript:/gi,
        /on\\w+\\s*=/gi,
        /('|(\\-\\-)|;|\\||\\*|%|=)/gi
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          return res.status(400).json({
            error: 'Invalid input detected',
            message: 'Request contains potentially dangerous content'
          });
        }
      }
      
      // Limiter la taille des inputs
      if (value.length > 1000) {
        return res.status(400).json({
          error: 'Input too large',
          message: 'Individual input fields cannot exceed 1000 characters'
        });
      }
    }
  }
  
  next();
}
`;
      
      // Ajouter le middleware au début du fichier
      content = content.replace(
        /(const.*=.*require.*;\s*)+/,
        `$&\n${validationMiddleware}\n`
      );
      
      // Ajouter validateProxyInput avant chaque ProxyService.proxyToMonty
      content = content.replace(
        /async\s+(\w+)\s*\(\s*req\s*,\s*res\s*\)\s*{(\s*await\s+ProxyService\.proxyToMonty)/g,
        'async $1(req, res) {\n    // Validation d\'input\n    const validation = validateProxyInput(req, res, () => {});\n    if (validation) return validation;\n    \n   $2'
      );
      
      fs.writeFileSync(controllerPath, content);
    }
  });
  
  console.log('✅ Added input validation to proxy controllers');
}

// 5. Améliorer la gestion des tokens JWT
function improveTokenManagement() {
  console.log('🎫 Improving JWT token management...');
  
  const passportPath = path.join(__dirname, '../src/config/passport.js');
  let content = fs.readFileSync(passportPath, 'utf8');
  
  // Ajouter validation d'expiration explicite
  const tokenValidation = `
// Validation supplémentaire pour les tokens JWT
function validateJWTToken(payload, done) {
  // Vérifier l'expiration explicitement
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return done(null, false, { message: 'Token expired' });
  }
  
  // Vérifier l'issuer si configuré
  if (payload.iss && payload.iss !== 'simwego-api') {
    return done(null, false, { message: 'Invalid token issuer' });
  }
  
  return done(null, payload);
}
`;
  
  if (!content.includes('validateJWTToken')) {
    content = content.replace(
      /(passport\.use\(.*new JwtStrategy)/,
      `${tokenValidation}\n$1`
    );
    
    // Utiliser la validation dans les stratégies
    content = content.replace(
      /async\s*\(\s*payload\s*,\s*done\s*\)\s*=>\s*{/g,
      'async (payload, done) => {\n    return validateJWTToken(payload, done);'
    );
    
    fs.writeFileSync(passportPath, content);
  }
  
  console.log('✅ Improved JWT token validation');
}

// 6. Créer un script de rotation des secrets
function createSecretRotationScript() {
  console.log('🔄 Creating secret rotation script...');
  
  const rotationScript = `#!/usr/bin/env node
// scripts/rotate-secrets.js - Script pour faire la rotation des secrets de sécurité

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function rotateSecrets() {
  console.log('🔄 Rotating security secrets...');
  
  const newSecrets = {
    JWT_SECRET: generateSecureSecret(64),
    ADMIN_JWT_SECRET: generateSecureSecret(64),
    DB_ENCRYPTION_KEY: generateSecureSecret(64),
    CLIENT_TEST_API_KEY: generateSecureSecret(32),
    CLIENT_REAL_API_KEY: generateSecureSecret(32)
  };
  
  console.log('\\n🔑 New secrets generated:');
  Object.entries(newSecrets).forEach(([key, value]) => {
    console.log(\`\${key}=\${value}\`);
  });
  
  console.log('\\n⚠️  IMPORTANT: Update your .env file with these new secrets');
  console.log('⚠️  IMPORTANT: Restart your application after updating');
  console.log('⚠️  IMPORTANT: All existing JWT tokens will be invalidated');
  
  return newSecrets;
}

if (require.main === module) {
  rotateSecrets();
}

module.exports = { rotateSecrets };
`;
  
  const scriptPath = path.join(__dirname, '../scripts/rotate-secrets.js');
  fs.writeFileSync(scriptPath, rotationScript);
  fs.chmodSync(scriptPath, '755');
  
  console.log('✅ Created secret rotation script');
}

// 7. Ajouter commandes npm pour la sécurité
function addSecurityNpmScripts() {
  console.log('📦 Adding security npm scripts...');
  
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.scripts = {
    ...packageJson.scripts,
    'security:audit': 'npm audit',
    'security:test': 'jest tests/security/',
    'security:rotate': 'node scripts/rotate-secrets.js',
    'security:check': 'npm run security:audit && npm run security:test'
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added security npm scripts');
}

// Exécuter toutes les corrections
async function main() {
  try {
    fixDefaultJWTSecret();
    createSecureEnvExample();
    addInputValidationToControllers();
    improveTokenManagement();
    createSecretRotationScript();
    addSecurityNpmScripts();
    
    console.log('\n🎉 Security fixes completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy .env.example to .env and update with your secure values');
    console.log('2. Run npm run security:test to validate fixes');
    console.log('3. Use npm run security:rotate to generate new secrets when needed');
    console.log('4. Run npm run security:check regularly for ongoing security validation');
    
  } catch (error) {
    console.error('❌ Error fixing security issues:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
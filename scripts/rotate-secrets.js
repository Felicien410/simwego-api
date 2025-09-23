#!/usr/bin/env node
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
  
  console.log('\n🔑 New secrets generated:');
  Object.entries(newSecrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  console.log('\n⚠️  IMPORTANT: Update your .env file with these new secrets');
  console.log('⚠️  IMPORTANT: Restart your application after updating');
  console.log('⚠️  IMPORTANT: All existing JWT tokens will be invalidated');
  
  return newSecrets;
}

if (require.main === module) {
  rotateSecrets();
}

module.exports = { rotateSecrets };

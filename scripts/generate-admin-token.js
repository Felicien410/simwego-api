#!/usr/bin/env node
// scripts/generate-admin-token.js - Generate admin JWT token and password hash

require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

function generateAdminToken() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('❌ JWT_SECRET not found in environment variables');
    process.exit(1);
  }

  // Admin payload - valid for tests
  const payload = {
    id: 'admin_test',
    username: 'test_admin', 
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    // Token valid for 1 year for testing
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
  };

  const token = jwt.sign(payload, secret);
  
  console.log('🔐 Generated Admin JWT Token:');
  console.log('');
  console.log(token);
  console.log('');
  console.log('📝 Add this to your .env file:');
  console.log(`TEST_ADMIN_TOKEN=${token}`);
  console.log('');
  console.log('✅ Token valid for 1 year');
  console.log('👤 Admin ID: admin_test');
  console.log('🔑 Username: test_admin');
  console.log('🛡️ Role: admin');
  
  return token;
}

if (require.main === module) {
  generateAdminToken();
}

module.exports = { generateAdminToken };
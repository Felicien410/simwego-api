// src/middleware/inputValidation.js - Validation stricte des entrées

const validator = require('validator');
const xss = require('xss');
const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('../config/database');

/**
 * Patterns dangereux à rejeter immédiatement
 */
const DANGEROUS_PATTERNS = [
  // XSS patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /alert\s*\(/gi,
  /document\./gi,
  /window\./gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /<meta/gi,
  
  // SQL injection patterns
  /(\bunion\b.*\bselect\b)/gi,
  /(\bselect\b.*\bfrom\b)/gi,
  /(\binsert\b.*\binto\b)/gi,
  /(\bdelete\b.*\bfrom\b)/gi,
  /(\bdrop\b.*\btable\b)/gi,
  /(\bupdate\b.*\bset\b)/gi,
  /(;\s*--)/gi,
  /(\bor\b.*=.*)/gi,
  /(\band\b.*=.*)/gi,
  /(\bexec\b.*\()/gi,
  
  // Command injection
  /(\|\s*\w+)/gi,
  /(;\s*\w+)/gi,
  /(`.*`)/gi,
  /(\$\(.*\))/gi
];

/**
 * Vérifier si une chaîne contient du contenu dangereux
 */
function containsDangerousContent(input) {
  if (typeof input !== 'string') return false;
  
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Middleware strict qui rejette TOUT contenu dangereux
 */
const strictInputValidation = (req, res, next) => {
  const checkObject = (obj, path = '') => {
    if (typeof obj === 'string') {
      // Vérifier les patterns dangereux
      if (containsDangerousContent(obj)) {
        logger.error('DANGEROUS INPUT DETECTED AND BLOCKED', {
          path,
          input: obj.substring(0, 100),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          clientId: req.client?.id || 'unknown'
        });
        
        return {
          error: 'SECURITY_VIOLATION',
          message: 'Input contains potentially dangerous content and has been blocked',
          field: path,
          severity: 'HIGH'
        };
      }
      
      // Vérifier si c'est du HTML malveillant
      const cleaned = xss(obj, { whiteList: {} }); // Pas de tags autorisés
      if (cleaned !== obj) {
        logger.warn('HTML content detected and sanitized', {
          path,
          original: obj.substring(0, 100),
          cleaned: cleaned.substring(0, 100),
          ip: req.ip
        });
        
        return {
          error: 'HTML_NOT_ALLOWED',
          message: 'HTML content is not allowed in this field',
          field: path
        };
      }
      
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const result = checkObject(value, path ? `${path}.${key}` : key);
        if (result) return result;
      }
    }
    
    return null;
  };

  // Vérifier body, query et params
  const sources = [
    { data: req.body, name: 'body' },
    { data: req.query, name: 'query' },
    { data: req.params, name: 'params' }
  ];

  for (const source of sources) {
    if (source.data) {
      const violation = checkObject(source.data, source.name);
      if (violation) {
        return res.status(400).json({
          error: 'Input validation failed',
          details: violation,
          timestamp: new Date().toISOString(),
          requestId: req.id || Date.now()
        });
      }
    }
  }

  next();
};

/**
 * Validation spécifique pour la création de clients
 */
const validateClientCreation = [
  // Validation stricte du nom
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Name can only contain letters, numbers, spaces, hyphens, underscores and dots')
    .custom((value) => {
      if (containsDangerousContent(value)) {
        throw new Error('Name contains forbidden content');
      }
      return true;
    }),

  // Validation du username Monty
  body('monty_username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Monty username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Monty username can only contain letters, numbers and underscores'),

  // Validation du password - permettre caractères spéciaux
  body('monty_password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters')
    .custom((value) => {
      // Vérifier seulement les patterns vraiment dangereux pour les mots de passe
      const dangerousPasswordPatterns = [
        /<script/gi,
        /javascript:/gi,
        /eval\s*\(/gi,
        /document\./gi,
        /(\bunion\b.*\bselect\b)/gi,
        /(\bselect\b.*\bfrom\b)/gi,
        /(\bdrop\b.*\btable\b)/gi
      ];
      
      const isDangerous = dangerousPasswordPatterns.some(pattern => pattern.test(value));
      if (isDangerous) {
        throw new Error('Password contains forbidden script content');
      }
      return true;
    }),

  // Description optionnelle
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .custom((value) => {
      if (value && containsDangerousContent(value)) {
        throw new Error('Description contains forbidden content');
      }
      return true;
    }),

  // Active flag
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean value')
];

/**
 * Validation pour la mise à jour des clients (tous les champs sont optionnels)
 */
const validateClientUpdate = [
  // Nom optionnel
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .custom((value) => {
      if (value && containsDangerousContent(value)) {
        throw new Error('Name contains forbidden content');
      }
      return true;
    }),

  // Username Monty optionnel
  body('monty_username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Monty username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Monty username can only contain letters, numbers and underscores'),

  // Password optionnel
  body('monty_password')
    .optional()
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters')
    .custom((value) => {
      if (value) {
        const dangerousPasswordPatterns = [
          /<script/gi,
          /javascript:/gi,
          /eval\s*\(/gi,
          /document\./gi,
          /(\bunion\b.*\bselect\b)/gi,
          /(\bselect\b.*\bfrom\b)/gi,
          /(\bdrop\b.*\btable\b)/gi
        ];
        
        const isDangerous = dangerousPasswordPatterns.some(pattern => pattern.test(value));
        if (isDangerous) {
          throw new Error('Password contains forbidden script content');
        }
      }
      return true;
    }),

  // Description optionnelle
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .custom((value) => {
      if (value && containsDangerousContent(value)) {
        throw new Error('Description contains forbidden content');
      }
      return true;
    }),

  // Active flag optionnel
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean value')
];

/**
 * Middleware pour gérer les erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Input validation failed', {
      errors: errorDetails,
      ip: req.ip,
      path: req.path,
      clientId: req.client?.id || 'unknown'
    });

    return res.status(400).json({
      error: 'Validation failed',
      message: 'Input data does not meet security requirements',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Validation pour les paramètres UUID
 */
const validateUUID = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

/**
 * Validation pour les queries de recherche
 */
const validateSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters')
    .custom((value) => {
      if (value && containsDangerousContent(value)) {
        throw new Error('Search query contains forbidden content');
      }
      return true;
    }),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be 0 or greater'),
    
  handleValidationErrors
];

module.exports = {
  strictInputValidation,
  validateClientCreation,
  validateClientUpdate,
  handleValidationErrors,
  validateUUID,
  validateSearchQuery,
  containsDangerousContent
};
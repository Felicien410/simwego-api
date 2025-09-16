# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine as builder

# Installer les outils nécessaires
RUN apk add --no-cache python3 make g++ curl

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Stage de production
FROM node:18-alpine

# Installer curl pour les health checks
RUN apk add --no-cache curl

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Créer le répertoire de travail
WORKDIR /app

# Copier les dépendances depuis le builder
COPY --from=builder /app/node_modules ./node_modules

# Copier le code source
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY scripts/ ./scripts/
COPY docs/ ./docs/
COPY package*.json ./

# Créer le dossier logs
RUN mkdir -p logs && chown -R nodejs:nodejs /app

# Passer à l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Commande de démarrage
CMD ["node", "src/app.js"]
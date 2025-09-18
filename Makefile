# Makefile SimWeGo API
.PHONY: all re up down logs test admin-dashboard list-clients migrate seed

# Variables
GREEN = \033[0;32m
RED = \033[0;31m
NC = \033[0m

all: ## Lance l'application complète avec dashboard admin
	@echo "$(GREEN)🚀 Démarrage SimWeGo API$(NC)"
	docker-compose --profile admin up -d --build
	@echo "$(GREEN)✅ API disponible sur http://localhost:3001$(NC)"
	@echo "$(GREEN)🔧 Dashboard Admin (Adminer) disponible sur http://localhost:8080$(NC)"
	@echo "$(GREEN)📝 Credentials DB: simwego_user / simwego_password_2024$(NC)"
	@echo "$(GREEN)🔄 Application des migrations...$(NC)"
	make migrate
	@echo "$(GREEN)🌱 Application des seeds...$(NC)"
	make seed
	@echo "$(GREEN)🚀 Démarrage Dashboard React...$(NC)"
	@if ! lsof -i :3002 > /dev/null 2>&1; then \
		cd admin-dashboard && npm run dev & \
		echo "$(GREEN)⚛️  Dashboard React disponible sur http://localhost:3002$(NC)"; \
	else \
		echo "$(GREEN)⚛️  Dashboard React déjà en cours sur http://localhost:3002$(NC)"; \
	fi

re: ## Recrée tout (supprime volumes, containers, images et redémarre)
	@echo "$(GREEN)🔄 Reset complet SimWeGo$(NC)"
	docker-compose --profile admin down -v --remove-orphans
	docker system prune -f
	make all

migrate: ## Applique les migrations de la base de données
	npm run db:migrate

seed: ## Applique les seeds de la base de données
	npm run db:seed

up: ## Démarre les services avec dashboard admin
	docker-compose --profile admin up -d
	@echo "$(GREEN)✅ Services démarrés$(NC)"
	@echo "$(GREEN)🔧 Dashboard Admin: http://localhost:8080$(NC)"

down: ## Arrête les services
	docker-compose --profile admin down

logs: ## Affiche les logs
	docker-compose logs -f api

test: ## Lance les tests
	@echo "$(GREEN)🧪 Lancement des tests de sécurité$(NC)"
	@export $$(grep -v '^#' .env | xargs) && npm test

admin-dashboard: ## Lance uniquement le dashboard admin
	@echo "$(GREEN)🔧 Lancement du dashboard admin$(NC)"
	docker-compose --profile admin up -d adminer
	@echo "$(GREEN)✅ Dashboard Admin disponible sur http://localhost:8080$(NC)"
	@echo "$(GREEN)📝 Serveur: postgres$(NC)"
	@echo "$(GREEN)📝 Base: simwego$(NC)"
	@echo "$(GREEN)📝 Utilisateur: simwego_user$(NC)"
	@echo "$(GREEN)📝 Mot de passe: simwego_password_2024$(NC)"

list-clients: ## Liste tous les clients avec toutes leurs infos
	@echo "$(GREEN)📋 Liste complète des clients SimWeGo$(NC)"
	@echo "ID | Name | Active | Monty User | API Key | Token Status | Agent ID | Reseller ID"
	@echo "---|------|--------|------------|---------|--------------|----------|------------"
	@export $$(grep -v '^#' .env | xargs) && \
	curl -s -X GET http://localhost:3001/admin/clients \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $$TEST_ADMIN_TOKEN" \
		| jq -r 'if .clients then (.clients[] | "\(.id) | \(.name) | \(.active) | \(.monty_username) | \(.api_key) | \(.token_status) | \(.agent_id // "N/A") | \(.reseller_id // "N/A")") else "Aucun client trouvé" end'

.DEFAULT_GOAL := all
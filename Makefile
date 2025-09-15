# Makefile SimWeGo API
.PHONY: all re up down logs test

# Variables
GREEN = \033[0;32m
RED = \033[0;31m
NC = \033[0m

all: ## Lance l'application complète
	@echo "$(GREEN)🚀 Démarrage SimWeGo API$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)✅ API disponible sur http://localhost:3001$(NC)"

re: ## Recrée tout (supprime volumes, containers, images et redémarre)
	@echo "$(GREEN)🔄 Reset complet SimWeGo$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker-compose up -d --build
	@echo "$(GREEN)✅ Reset terminé - API disponible sur http://localhost:3001$(NC)"

migrate: ## Applique les migrations de la base de données
	npm run db:migrate

seed: ## Applique les seeds de la base de données
	npm run db:seed

up: ## Démarre les services
	docker-compose up -d

down: ## Arrête les services
	docker-compose down

logs: ## Affiche les logs
	docker-compose logs -f simwego-api

test: ## Lance les tests
	npm test

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
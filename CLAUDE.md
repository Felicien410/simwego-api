# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm start` - Start the API server (production mode)
- `npm run dev` - Start with nodemon for development
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with automatic fixes

### Database Management
- `npm run db:migrate` - Apply database migrations
- `npm run db:seed` - Seed clients data
- `npm run db:reset` - Reset database (undo migrations, migrate, seed)

### Docker Operations
- `make all` or `make` - Start the complete application with Docker
- `make re` - Complete reset (removes volumes, containers, and rebuilds)
- `make up` - Start Docker services
- `make down` - Stop Docker services
- `make logs` - Show API logs
- `docker-compose up -d` - Start services in background
- `docker-compose down -v` - Stop and remove volumes

### Client Management
- `npm run client:list` - List all clients
- `npm run client:add` - Add a new client
- `make list-clients` - Show detailed client information via admin API

## Architecture Overview

SimWeGo API is a **multi-client proxy API** for Monty eSIM with a modular architecture:

### Core Structure
- **Type**: Express.js API with modular controller architecture
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Passport.js with JWT and Bearer token strategies
- **Target**: Proxies requests to Monty eSIM API
- **Environment**: Dockerized with docker-compose

### Key Components

#### API Structure (82 endpoints organized in 10 domains)
- `src/api/v0/controllers/` - 10 domain controllers
- `src/api/v0/routes/` - Route definitions
- Base path: `/api/v0/`

#### Domain Controllers
1. **Agent** (10 endpoints) - Authentication, user management
2. **Bundles** (18 endpoints) - eSIM packages and offers
3. **Orders** (12 endpoints) - Purchase history and management
4. **Reseller** (11 endpoints) - Reseller account management
5. **Branch** (5 endpoints) - Branch/location management
6. **Role** (6 endpoints) - Permissions and roles
7. **NetworkList** (6 endpoints) - Mobile network configurations
8. **IssueReport** (6 endpoints) - Support and issue tracking
9. **Voucher** (5 endpoints) - Promotional codes
10. **Utilities** (3 endpoints) - Health, tokens, affiliate

#### Admin System
- `src/admin/routes/` - Admin routes with `/admin` prefix
- `src/admin/controllers/` - Admin controllers for client management
- JWT-based authentication for admin operations

#### Core Services
- `src/services/montyAuth.js` - Monty API authentication and health checks
- `src/services/proxyHandler.js` - Request proxying logic
- `src/services/encryption.js` - Data encryption utilities
- `src/models/` - Sequelize models (Client, TokenCache)

### Authentication Flow
1. Client authenticates with Bearer token (API key)
2. System validates client and retrieves Monty credentials
3. Obtains/refreshes Monty API token (cached in TokenCache)
4. Proxies request to Monty API with authentication
5. Returns response to client

### Environment Configuration
- Development: `npm run dev` (port 3001)
- Production: Docker container with PostgreSQL
- Environment variables in `.env` file
- Database connection via `src/config/database.js`

### Key Files
- `src/app.js` - Main application class with modular setup
- `src/config/environment.js` - Environment configuration
- `src/config/passport.js` - Authentication strategies
- `docker-compose.yml` - Complete infrastructure setup
- `Makefile` - Convenient development commands

### Important Notes
- All API endpoints require authentication except `/`, `/health`, `/test`
- Client credentials are encrypted in database
- Token caching prevents repeated Monty API authentication
- Comprehensive logging with Winston
- Health checks available at `/health` endpoint
- API documentation at root `/` endpoint

### Testing
- Jest test framework
- Supertest for API testing
- Tests should cover controller logic and authentication flows

### Development Workflow
1. Use `make all` for full Docker setup
2. Use `npm run dev` for local development
3. Database migrations via `npm run db:migrate`
4. Use `make logs` to monitor application
5. Admin interface development completed (React dashboard available)
-- docker/postgres/init.sql - Script d'initialisation PostgreSQL

-- Configuration de la base de données
SET timezone TO 'UTC';

-- Créer des extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Créer un utilisateur pour l'application si pas déjà fait par Docker
DO $$ 
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'simwego_user') THEN
      CREATE ROLE simwego_user LOGIN PASSWORD 'simwego_password_2024';
   END IF;
END
$$;

-- Accorder les privilèges sur la base de données
GRANT ALL PRIVILEGES ON DATABASE simwego TO simwego_user;

-- Se connecter à la base de données simwego
\c simwego;

-- Accorder les privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO simwego_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO simwego_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO simwego_user;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Configuration de performance (optionnel)
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log des requêtes > 1s

-- Redémarrage nécessaire pour appliquer certains paramètres
SELECT pg_reload_conf();
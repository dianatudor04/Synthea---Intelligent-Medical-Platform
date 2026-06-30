# ─────────────────────────────────────────────────────────────────────────────
#  Synthea — developer workflow
#
#  Quick start:
#     make setup     # infra + deps + db (migrate & seed)
#     make backend   # terminal 1
#     make worker    # terminal 2
#     make frontend  # terminal 3
#
#  Full stack in Docker instead:
#     make stack
# ─────────────────────────────────────────────────────────────────────────────

# Pinned so the Prisma CLI (which doesn't honour the app's dotenv override) and
# the dev servers always target the compose database, regardless of any stale
# DATABASE_URL/REDIS_URL exported in the shell.
export DATABASE_URL := postgresql://synthea_user:synthea_pass@localhost:5432/synthea_db
export REDIS_URL := redis://localhost:6379

.PHONY: setup infra install migrate seed db backend worker frontend dev stack down clean logs

## One-shot local setup: backing services, dependencies, and database.
setup: infra install db
	@echo "✅ Setup complete. Now run, in separate terminals: make backend | make worker | make frontend"

## Start backing services (postgres, redis, rustfs, mailpit) in Docker.
infra:
	docker compose up -d
	@echo "⏳ Waiting for postgres to be healthy..."
	@until [ "$$(docker inspect -f '{{.State.Health.Status}}' synthea_postgres 2>/dev/null)" = "healthy" ]; do sleep 1; done
	@echo "✅ Infra is up."

## Install backend + frontend dependencies.
install:
	npm --prefix backend install
	npm --prefix frontend install

## Apply Prisma migrations.
migrate:
	npm --prefix backend exec -- prisma migrate deploy

## Seed demo data (admin/doctor/patient logins, appointments, etc.).
seed:
	npm --prefix backend run prisma:seed

## Generate client, migrate, and seed.
db:
	npm --prefix backend exec -- prisma generate
	$(MAKE) migrate
	$(MAKE) seed

## Dev servers (run each in its own terminal).
backend:
	npm --prefix backend run dev

worker:
	npm --prefix backend run worker

frontend:
	npm --prefix frontend run dev

## Full production-like stack in Docker (backend + worker + frontend + infra).
stack:
	docker compose --profile full up -d --build

## Stop everything (keeps volumes / data).
down:
	docker compose --profile full down

## Stop and delete volumes (wipes the database).
clean:
	docker compose --profile full down -v

## Tail infra logs.
logs:
	docker compose logs -f

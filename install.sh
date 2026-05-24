#!/usr/bin/env bash
# Local development setup — mirrors README "Start everything" steps.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

info() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die()  { printf '\n\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

check_prerequisites() {
  info "Checking prerequisites"

  command_exists docker || die "Docker is required. See https://docs.docker.com/get-docker/"
  docker compose version >/dev/null 2>&1 || die "Docker Compose is required (docker compose plugin)."

  if command_exists python3; then
    PYTHON=python3
  elif command_exists python3.12; then
    PYTHON=python3.12
  else
    die "Python 3.12+ is required."
  fi

  "$PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)' \
    || die "Python 3.12+ is required (found $($PYTHON --version 2>&1))."

  command_exists node || die "Node.js is required."
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$NODE_MAJOR" -lt 20 ]]; then
    die "Node.js 20+ is required (found $(node --version))."
  fi

  command_exists npm || die "npm is required."
}

setup_env() {
  info "Copying environment file"
  if [[ -f backend/.env ]]; then
    warn "backend/.env already exists — skipping copy"
  else
    cp .env.example backend/.env
    echo "Created backend/.env from .env.example"
  fi
}

start_docker_services() {
  info "Starting Postgres, Redis, and MinIO"
  docker compose up -d --wait db redis minio
}

setup_backend() {
  info "Installing backend dependencies"
  (cd backend && "$PYTHON" -m pip install -e ".[dev]")

  info "Running database migrations"
  (cd backend && alembic upgrade head)

  info "Seeding tool catalog"
  (cd backend && "$PYTHON" app/db/seed.py)
}

setup_frontend() {
  info "Installing frontend dependencies"
  (cd frontend && npm install)
}

print_next_steps() {
  cat <<'EOF'

Setup complete.

Start the dev servers (in separate terminals):

  cd backend && uvicorn app.main:app --reload    # http://localhost:8000
  cd frontend && npm run dev                      # http://localhost:3000

API docs: http://localhost:8000/api/docs

Sign in without OAuth: http://localhost:3000/login → Development login
  username: max   password: mustermann
(see README "Dev login"; credentials in backend/.env as DEV_LOGIN_*)

For OAuth later, add Google/GitHub credentials to backend/.env
(see README "OAuth setup").
EOF
}

main() {
  check_prerequisites
  setup_env
  start_docker_services
  setup_backend
  setup_frontend
  print_next_steps
}

main "$@"

#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC} $1"; }
fail() { echo -e "${RED}FAIL${NC} $1"; FAILURES=$((FAILURES + 1)); }
info() { echo -e "${YELLOW}>>>${NC} $1"; }

FAILURES=0

# Expected Vercel project names — prevents deploying to wrong target
EXPECTED_PUBLIC_PROJECT="easy-rental"
EXPECTED_ADMIN_PROJECT="easy-rental-admin"

usage() {
  echo "Usage: bash scripts/deploy.sh [public|admin|all]"
  exit 1
}

# --- Pre-check: env file ---
precheck_env() {
  local site="$1"
  local env_file="$PROJECT_ROOT/$site/.env.production"

  if [[ ! -f "$env_file" ]]; then
    fail "$site/.env.production is missing"
    return
  fi

  if ! grep -q "VITE_API_URL=" "$env_file"; then
    fail "$site/.env.production has no VITE_API_URL"
    return
  fi

  pass "$site/.env.production exists with VITE_API_URL"
}

# --- Pre-check: Vercel project target ---
precheck_vercel() {
  local deploy_dir="$1"
  local expected_name="$2"
  local project_file="$deploy_dir/.vercel/project.json"

  if [[ ! -f "$project_file" ]]; then
    fail "No .vercel/project.json in $deploy_dir — run 'vercel link' first"
    return
  fi

  local actual_name
  actual_name=$(grep -o '"projectName":"[^"]*"' "$project_file" | cut -d'"' -f4)

  if [[ "$actual_name" != "$expected_name" ]]; then
    fail "Vercel project is '$actual_name' but expected '$expected_name' — WRONG DEPLOY TARGET"
    return
  fi

  pass "Vercel project target is '$actual_name'"
}

# --- Deploy ---
deploy_public() {
  info "Deploying public site..."
  cd "$PROJECT_ROOT"
  vercel --prod
}

deploy_admin() {
  info "Deploying admin dashboard..."
  cd "$PROJECT_ROOT/admin-dashboard"
  vercel --prod
}

# --- Smoke test ---
smoke_test() {
  info "Running smoke tests against live sites..."
  echo ""

  # Public API health
  local health
  health=$(curl -sf --max-time 15 "https://easy-rental.ca/api/health" 2>/dev/null) || true
  if echo "$health" | grep -q '"status"'; then
    pass "easy-rental.ca/api/health returns status"
  else
    fail "easy-rental.ca/api/health did not return status JSON"
  fi

  # Public API properties
  local props
  props=$(curl -sf --max-time 15 "https://easy-rental.ca/api/properties" 2>/dev/null) || true
  if echo "$props" | grep -q '"data"'; then
    pass "easy-rental.ca/api/properties returns data"
  else
    fail "easy-rental.ca/api/properties did not return data JSON"
  fi

  # Admin site loads
  local admin_resp
  admin_resp=$(curl -sf --max-time 15 -o /dev/null -w "%{http_code}" "https://admin.easy-rental.ca" 2>/dev/null) || true
  if [[ "$admin_resp" == "200" ]]; then
    pass "admin.easy-rental.ca returns 200"
  else
    fail "admin.easy-rental.ca returned $admin_resp (expected 200)"
  fi

  echo ""
  if [[ $FAILURES -gt 0 ]]; then
    echo -e "${RED}=== $FAILURES SMOKE TEST(S) FAILED ===${NC}"
    echo "DO NOT mark deploy as complete."
    exit 1
  else
    echo -e "${GREEN}=== ALL SMOKE TESTS PASSED ===${NC}"
  fi
}

# --- Main ---
case "$TARGET" in
  public)
    precheck_env "public-site"
    precheck_vercel "$PROJECT_ROOT" "$EXPECTED_PUBLIC_PROJECT"
    [[ $FAILURES -gt 0 ]] && exit 1
    deploy_public
    smoke_test
    ;;
  admin)
    precheck_env "admin-dashboard"
    precheck_vercel "$PROJECT_ROOT/admin-dashboard" "$EXPECTED_ADMIN_PROJECT"
    [[ $FAILURES -gt 0 ]] && exit 1
    deploy_admin
    smoke_test
    ;;
  all)
    precheck_env "public-site"
    precheck_env "admin-dashboard"
    precheck_vercel "$PROJECT_ROOT" "$EXPECTED_PUBLIC_PROJECT"
    precheck_vercel "$PROJECT_ROOT/admin-dashboard" "$EXPECTED_ADMIN_PROJECT"
    [[ $FAILURES -gt 0 ]] && exit 1
    deploy_public
    deploy_admin
    smoke_test
    ;;
  *)
    usage
    ;;
esac

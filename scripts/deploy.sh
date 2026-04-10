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

# Deploy hooks — trigger builds from latest Git commit on Bill's Vercel
HOOK_PUBLIC="https://api.vercel.com/v1/integrations/deploy/prj_U6RoeJq12k6RfH5UbIg8yXih5eNf/DEpkiDF50R"
HOOK_ADMIN="https://api.vercel.com/v1/integrations/deploy/prj_FKs82yEVkpL8xrOwQeHb2BjyedoD/Jb28EmQGRq"

# Bill's Vercel token — loaded from .env.deploy (gitignored), NOT hardcoded
if [[ -f "$PROJECT_ROOT/.env.deploy" ]]; then
  source "$PROJECT_ROOT/.env.deploy"
fi
BILL_TOKEN="${VERCEL_TOKEN_BILL:?Set VERCEL_TOKEN_BILL in .env.deploy}"
BILL_TEAM="team_A4f0ZG4yILHXCqLVckop789m"
PUBLIC_PROJECT="prj_U6RoeJq12k6RfH5UbIg8yXih5eNf"
ADMIN_PROJECT="prj_FKs82yEVkpL8xrOwQeHb2BjyedoD"

usage() {
  echo "Usage: bash scripts/deploy.sh [public|admin|all]"
  echo ""
  echo "Deploys from the latest Git commit on Bill's Vercel."
  echo "Make sure your changes are committed and pushed to the bill remote first."
  exit 1
}

# --- Pre-check: uncommitted changes ---
precheck_git() {
  local status
  status=$(git -C "$PROJECT_ROOT" status --porcelain 2>/dev/null | head -5)
  if [[ -n "$status" ]]; then
    echo -e "${YELLOW}WARNING: Uncommitted changes detected. Deploy uses the latest pushed commit.${NC}"
    echo "$status"
    echo ""
  fi
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

# --- Deploy via hook ---
deploy_hook() {
  local name="$1"
  local hook_url="$2"
  local project_id="$3"

  info "Triggering $name deploy..."
  local response
  response=$(curl -sf -X POST "$hook_url" 2>/dev/null) || {
    fail "Failed to trigger $name deploy hook"
    return
  }
  pass "$name deploy triggered"

  # Wait for deploy to be READY (up to 3 minutes)
  info "Waiting for $name build..."
  local attempts=0
  local max_attempts=18
  while [[ $attempts -lt $max_attempts ]]; do
    sleep 10
    local state
    state=$(curl -sf -H "Authorization: Bearer $BILL_TOKEN" \
      "https://api.vercel.com/v6/deployments?projectId=$project_id&teamId=$BILL_TEAM&limit=1" 2>/dev/null \
      | node -e "const c=[];process.stdin.on('data',d=>c.push(d));process.stdin.on('end',()=>{const d=JSON.parse(Buffer.concat(c));console.log(d.deployments?.[0]?.state||'UNKNOWN')})" 2>/dev/null) || state="ERROR"

    if [[ "$state" == "READY" ]]; then
      pass "$name deploy is READY"
      return
    elif [[ "$state" == "ERROR" ]]; then
      fail "$name deploy FAILED"
      return
    fi
    attempts=$((attempts + 1))
    echo -n "."
  done
  echo ""
  fail "$name deploy timed out after 3 minutes"
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
    precheck_git
    precheck_env "public-site"
    [[ $FAILURES -gt 0 ]] && exit 1
    deploy_hook "public" "$HOOK_PUBLIC" "$PUBLIC_PROJECT"
    [[ $FAILURES -gt 0 ]] && exit 1
    smoke_test
    ;;
  admin)
    precheck_git
    precheck_env "admin-dashboard"
    [[ $FAILURES -gt 0 ]] && exit 1
    deploy_hook "admin" "$HOOK_ADMIN" "$ADMIN_PROJECT"
    [[ $FAILURES -gt 0 ]] && exit 1
    smoke_test
    ;;
  all)
    precheck_git
    precheck_env "public-site"
    precheck_env "admin-dashboard"
    [[ $FAILURES -gt 0 ]] && exit 1
    deploy_hook "public" "$HOOK_PUBLIC" "$PUBLIC_PROJECT"
    deploy_hook "admin" "$HOOK_ADMIN" "$ADMIN_PROJECT"
    [[ $FAILURES -gt 0 ]] && exit 1
    smoke_test
    ;;
  *)
    usage
    ;;
esac

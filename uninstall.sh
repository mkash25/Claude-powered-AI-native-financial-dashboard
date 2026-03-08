#!/usr/bin/env bash
# uninstall.sh — Remove the Financial Dashboard agent and its local state
# Usage: bash uninstall.sh
set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; DIM='\033[2m'; NC='\033[0m'

info()  { echo -e "${GREEN}[uninstall]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}      $*"; }
done_() { echo -e "  ${GREEN}✓${NC} $*"; }
skip()  { echo -e "  ${DIM}–${NC} $*"; }

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$PROJECT_DIR/agent"
PLIST="$HOME/Library/LaunchAgents/com.finanalyst.pipeline.plist"

echo -e "\n${BOLD}Financial Dashboard — Uninstaller${NC}\n"
echo -e "  This removes local state, credentials, and the scheduler."
echo -e "  ${DIM}Your Supabase data is NOT touched — delete it from supabase.com if needed.${NC}\n"

# ── 1. Stop and remove launchd scheduler (macOS) ──────────────────────────────
if [[ "$(uname)" == "Darwin" ]]; then
    if [[ -f "$PLIST" ]]; then
        echo -e "${BOLD}Scheduler (launchd):${NC}"
        launchctl unload "$PLIST" 2>/dev/null && done_ "Pipeline scheduler stopped" || warn "Scheduler was not running"
        rm -f "$PLIST"
        done_ "Plist removed: $PLIST"
    else
        skip "No launchd scheduler found"
    fi
fi

# ── 2. Remove cron entry (Linux) ──────────────────────────────────────────────
if [[ "$(uname)" == "Linux" ]]; then
    if crontab -l 2>/dev/null | grep -q "fin-analyst\|run_pipeline"; then
        echo -e "${BOLD}Scheduler (cron):${NC}"
        crontab -l 2>/dev/null | grep -v "fin-analyst\|run_pipeline" | crontab -
        done_ "Cron entry removed"
    else
        skip "No cron entry found"
    fi
fi

# ── 3. Credentials and access tokens ──────────────────────────────────────────
echo -e "\n${BOLD}Credentials and secrets:${NC}"
CRED_FILES=(
    "$AGENT_DIR/.env"
    "$AGENT_DIR/access_tokens.json"
    "$AGENT_DIR/access_tokens.enc"
    "$AGENT_DIR/.token_salt"
)
for f in "${CRED_FILES[@]}"; do
    if [[ -f "$f" ]]; then
        rm -f "$f"
        done_ "Removed: $(basename "$f")"
    else
        skip "Not found: $(basename "$f")"
    fi
done

# ── 4. Generated pipeline data ─────────────────────────────────────────────────
echo -e "\n${BOLD}Generated data:${NC}"
DATA_PATHS=(
    "$AGENT_DIR/portfolio_snapshot.json"
    "$AGENT_DIR/portfolio_history.json"
    "$AGENT_DIR/enriched_portfolio.json"
    "$AGENT_DIR/logs"
    "$AGENT_DIR/reports"
)
for p in "${DATA_PATHS[@]}"; do
    if [[ -e "$p" ]]; then
        rm -rf "$p"
        done_ "Removed: $(basename "$p")"
    else
        skip "Not found: $(basename "$p")"
    fi
done

# ── 5. Python virtual environment ─────────────────────────────────────────────
echo -e "\n${BOLD}Python environment:${NC}"
if [[ -d "$AGENT_DIR/.venv" ]]; then
    rm -rf "$AGENT_DIR/.venv"
    done_ "Removed: agent/.venv"
else
    skip "No .venv found"
fi

# ── 6. Node modules ───────────────────────────────────────────────────────────
echo -e "\n${BOLD}Node modules:${NC}"
if [[ -d "$PROJECT_DIR/node_modules" ]]; then
    printf "  Remove node_modules? [y/N] "
    read -r REMOVE_NODE
    if [[ "$REMOVE_NODE" =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR/node_modules"
        done_ "Removed: node_modules"
    else
        skip "Kept node_modules"
    fi
else
    skip "No node_modules found"
fi

# ── 7. Dashboard .env.local ───────────────────────────────────────────────────
echo -e "\n${BOLD}Dashboard credentials:${NC}"
if [[ -f "$PROJECT_DIR/.env.local" ]]; then
    printf "  Remove .env.local (dashboard API keys)? [y/N] "
    read -r REMOVE_ENVLOCAL
    if [[ "$REMOVE_ENVLOCAL" =~ ^[Yy]$ ]]; then
        rm -f "$PROJECT_DIR/.env.local"
        done_ "Removed: .env.local"
    else
        skip "Kept .env.local"
    fi
else
    skip "No .env.local found"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Done${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Local state removed. The repo directory itself is still here."
echo -e "  To fully remove: ${BOLD}cd .. && rm -rf $(basename "$PROJECT_DIR")${NC}"
echo ""
echo -e "  ${DIM}Supabase data (holdings, reports, analysis) was not touched."
echo -e "  Delete it at supabase.com → your project → Table Editor if needed.${NC}"
echo ""

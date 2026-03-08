#!/usr/bin/env bash
# install.sh — One-shot setup for Claude-Powered AI-Native Financial Dashboard
# Usage: bash install.sh
set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; DIM='\033[2m'; NC='\033[0m'

info()    { echo -e "${GREEN}[install]${NC} $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}   $*"; }
die()     { echo -e "${RED}[error]${NC}  $*" >&2; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}$*${NC}"; }
hint()    { echo -e "  ${DIM}$*${NC}"; }
ok()      { echo -e "  ${GREEN}✓${NC} $*"; }
fail()    { echo -e "  ${RED}✗${NC} $*"; }
skip()    { echo -e "  ${DIM}–${NC} $*"; }

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$PROJECT_DIR/agent"
cd "$PROJECT_DIR"

echo -e "\n${BOLD}Claude-Powered AI-Native Financial Dashboard — Setup${NC}\n"
echo -e "  This installs both components:"
echo -e "  ${DIM}• agent/   — Python pipeline (Plaid → Claude → Supabase)${NC}"
echo -e "  ${DIM}• ./       — Next.js dashboard${NC}"

# ── 1. Check Python ────────────────────────────────────────────────────────────
python_upgrade_hint() {
    local found="$1"
    echo -e "${RED}[error]${NC}  Python 3.12+ required (found $found).\n"
    if [[ "$(uname)" == "Darwin" ]]; then
        echo -e "  Quickest fix on macOS:\n"
        echo -e "    ${BOLD}# Option 1 — Homebrew (recommended)${NC}"
        echo -e "    brew install python@3.12"
        echo -e "    echo 'export PATH=\"/opt/homebrew/bin:\$PATH\"' >> ~/.zshrc"
        echo -e "    source ~/.zshrc\n"
        echo -e "    ${BOLD}# Option 2 — pyenv${NC}"
        echo -e "    brew install pyenv"
        echo -e "    pyenv install 3.12"
        echo -e "    pyenv global 3.12\n"
        echo -e "    ${BOLD}# Option 3 — direct download${NC}"
        echo -e "    https://python.org/downloads/\n"
        echo -e "  After installing, open a new terminal and re-run: ${BOLD}bash install.sh${NC}"
    else
        echo -e "  On Ubuntu/Debian:"
        echo -e "    sudo add-apt-repository ppa:deadsnakes/ppa"
        echo -e "    sudo apt install python3.12 python3.12-venv\n"
        echo -e "  Or use pyenv: https://github.com/pyenv/pyenv\n"
        echo -e "  After installing, open a new terminal and re-run: ${BOLD}bash install.sh${NC}"
    fi
    exit 1
}

# Resolve python binary — prefer python3.12 explicitly if python3 is older
PYTHON_BIN=""
if command -v python3.12 &>/dev/null; then
    PYTHON_BIN="python3.12"
elif command -v python3 &>/dev/null; then
    PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
    PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
    if [[ "$PY_MAJOR" -ge 3 && "$PY_MINOR" -ge 12 ]]; then
        PYTHON_BIN="python3"
    else
        python_upgrade_hint "$PY_VER"
    fi
else
    python_upgrade_hint "none found"
fi
PY_VER=$($PYTHON_BIN -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
info "Python $PY_VER ✓  ($PYTHON_BIN)"

# ── 2. Install uv if missing ───────────────────────────────────────────────────
if ! command -v uv &>/dev/null; then
    info "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi
info "uv $(uv --version | awk '{print $2}') ✓"

# ── 3. Install Python dependencies (agent) ────────────────────────────────────
info "Installing Python dependencies..."
cd "$AGENT_DIR"
uv sync --python "$PYTHON_BIN"
cd "$PROJECT_DIR"
info "Python dependencies installed ✓"

# ── 4. Install Node dependencies (dashboard) ──────────────────────────────────
if ! command -v node &>/dev/null; then
    die "Node.js 18+ is required for the dashboard. Install from https://nodejs.org/"
fi
NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [[ "$NODE_VER" -lt 18 ]]; then
    die "Node.js 18+ required (found $NODE_VER). Install from https://nodejs.org/"
fi
info "Node.js $NODE_VER ✓"
info "Installing dashboard dependencies..."
npm install --prefix "$PROJECT_DIR" --silent
info "Dashboard dependencies installed ✓"

# ── 5. Create agent runtime directories ───────────────────────────────────────
mkdir -p "$AGENT_DIR/logs" "$AGENT_DIR/reports"
info "Runtime directories created ✓"

# ══════════════════════════════════════════════════════════════════════════════
# ── 5. API Key Wizard ──────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

# Check if .env already exists and has values
WIZARD_NEEDED=true
if [[ -f "$AGENT_DIR/.env" ]]; then
    if grep -q "^ANTHROPIC_API_KEY=sk-ant-" "$AGENT_DIR/.env" 2>/dev/null; then
        echo ""
        echo -e "  ${YELLOW}.env already exists and appears configured.${NC}"
        printf "  Re-run the setup wizard? [y/N] "
        read -r RERUN
        if [[ ! "$RERUN" =~ ^[Yy]$ ]]; then
            WIZARD_NEEDED=false
        fi
    fi
fi

# Python validator — uses only stdlib, no deps required
validate_key() {
    local service="$1"
    local key="$2"
    local extra="${3:-}"
    python3 - "$service" "$key" "$extra" <<'PYEOF'
import sys, json
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

service, key, extra = sys.argv[1], sys.argv[2], sys.argv[3]

try:
    if service == "anthropic":
        req = Request(
            "https://api.anthropic.com/v1/models",
            headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
        )
        with urlopen(req, timeout=8) as r:
            sys.exit(0 if r.status == 200 else 1)

    elif service == "supabase":
        # extra = supabase URL
        url = extra.rstrip("/") + "/rest/v1/"
        req = Request(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})
        with urlopen(req, timeout=8) as r:
            sys.exit(0 if r.status in (200, 400) else 1)  # 400 = no table, but auth worked

    elif service == "plaid":
        # extra = plaid env (sandbox/development/production)
        env_map = {
            "sandbox": "https://sandbox.plaid.com",
            "development": "https://development.plaid.com",
            "production": "https://production.plaid.com",
        }
        base = env_map.get(extra, "https://development.plaid.com")
        # key = "CLIENT_ID::SECRET"
        client_id, secret = key.split("::", 1)
        payload = json.dumps({
            "client_id": client_id,
            "secret": secret,
            "count": 1,
            "offset": 0,
            "country_codes": ["US"],
        }).encode()
        req = Request(
            f"{base}/institutions/get",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urlopen(req, timeout=10) as r:
            sys.exit(0 if r.status == 200 else 1)

    elif service == "sendgrid":
        req = Request(
            "https://api.sendgrid.com/v3/user/account",
            headers={"Authorization": f"Bearer {key}"},
        )
        with urlopen(req, timeout=8) as r:
            sys.exit(0 if r.status == 200 else 1)

    elif service == "slack":
        # Send a silent test — Slack returns 200 + "ok" for valid webhooks
        payload = json.dumps({"text": "Financial Analyst Agent — setup test (ignore this)"}).encode()
        req = Request(key, data=payload, headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=8) as r:
            body = r.read().decode()
            sys.exit(0 if "ok" in body else 1)

except HTTPError as e:
    sys.exit(1)
except (URLError, Exception):
    sys.exit(2)  # 2 = network error / unreachable
PYEOF
}

# Prompt helpers
prompt_required() {
    # Usage: prompt_required VAR_NAME "Display label" "hint text" [secret]
    local var="$1" label="$2" hint_text="$3" secret="${4:-}"
    local value=""
    while [[ -z "$value" ]]; do
        echo ""
        echo -e "  ${BOLD}${label}${NC}"
        hint "$hint_text"
        if [[ "$secret" == "secret" ]]; then
            printf "  → "
            read -rs value
            echo ""
        else
            printf "  → "
            read -r value
        fi
        if [[ -z "$value" ]]; then
            warn "  This field is required. Please enter a value."
        fi
    done
    eval "$var='$value'"
}

prompt_optional() {
    local var="$1" label="$2" hint_text="$3" secret="${4:-}"
    echo ""
    echo -e "  ${BOLD}${label}${NC} ${DIM}(optional — press Enter to skip)${NC}"
    hint "$hint_text"
    if [[ "$secret" == "secret" ]]; then
        printf "  → "
        read -rs value
        echo ""
    else
        printf "  → "
        read -r value
    fi
    eval "$var='$value'"
}

prompt_choice() {
    local var="$1" label="$2" options="$3" default="$4"
    local value=""
    while true; do
        echo ""
        echo -e "  ${BOLD}${label}${NC}"
        hint "Options: $options  (default: $default)"
        printf "  → "
        read -r value
        value="${value:-$default}"
        if echo "$options" | grep -qw "$value"; then
            break
        fi
        warn "  Invalid choice. Enter one of: $options"
    done
    eval "$var='$value'"
}

test_key() {
    local label="$1" service="$2" key="$3" extra="${4:-}"
    printf "  Testing %s connection..." "$label"
    local exit_code=0
    validate_key "$service" "$key" "$extra" && exit_code=0 || exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        echo -e " ${GREEN}✓ connected${NC}"
        return 0
    elif [[ $exit_code -eq 2 ]]; then
        echo -e " ${YELLOW}⚠ could not reach server (check network)${NC}"
        return 1
    else
        echo -e " ${RED}✗ invalid credentials${NC}"
        return 1
    fi
}

# ── Status tracking ────────────────────────────────────────────────────────────
declare -A STATUS=()

if [[ "$WIZARD_NEEDED" == "true" ]]; then

    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  Credential Setup Wizard${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  You'll be prompted for each required API key."
    echo -e "  Keys are validated live — you'll know immediately if something is wrong."
    echo -e "  ${DIM}Secret inputs are hidden as you type.${NC}"

    # ── Plaid ──────────────────────────────────────────────────────────────────
    section "① Plaid  —  https://dashboard.plaid.com/developers/keys"
    echo -e "  ${DIM}Plaid connects to your brokerage accounts (Robinhood, SoFi, etc.)."
    echo -e "  You need Development access (free, up to 100 connections).${NC}"

    prompt_choice PLAID_ENV \
        "Plaid environment" \
        "sandbox development production" \
        "development"

    while true; do
        prompt_required PLAID_CLIENT_ID \
            "Plaid Client ID" \
            "Found at: dashboard.plaid.com → Developers → Keys (same for all environments)"

        prompt_required PLAID_SECRET \
            "Plaid Secret" \
            "Found at: dashboard.plaid.com → Developers → Keys → ${PLAID_ENV} secret" \
            "secret"

        if test_key "Plaid" "plaid" "${PLAID_CLIENT_ID}::${PLAID_SECRET}" "$PLAID_ENV"; then
            STATUS[plaid]="ok"
            break
        else
            echo ""
            printf "  Retry Plaid credentials? [Y/n] "
            read -r retry
            if [[ "$retry" =~ ^[Nn]$ ]]; then
                STATUS[plaid]="failed"
                break
            fi
        fi
    done

    # ── Anthropic ──────────────────────────────────────────────────────────────
    section "② Anthropic (Claude)  —  https://console.anthropic.com/settings/keys"
    echo -e "  ${DIM}Claude analyzes your portfolio and generates buy/sell/hold recommendations."
    echo -e "  Costs ~\$0.36 per pipeline run at 3×/week = ~\$5/month.${NC}"

    while true; do
        prompt_required ANTHROPIC_API_KEY \
            "Anthropic API Key" \
            "Starts with sk-ant-  |  Get one at: console.anthropic.com/settings/keys" \
            "secret"

        if [[ ! "$ANTHROPIC_API_KEY" =~ ^sk-ant- ]]; then
            warn "  Key should start with 'sk-ant-' — double-check you copied the full key."
            continue
        fi

        if test_key "Anthropic" "anthropic" "$ANTHROPIC_API_KEY"; then
            STATUS[anthropic]="ok"
            break
        else
            echo ""
            printf "  Retry Anthropic key? [Y/n] "
            read -r retry
            if [[ "$retry" =~ ^[Nn]$ ]]; then
                STATUS[anthropic]="failed"
                break
            fi
        fi
    done

    # ── Supabase ───────────────────────────────────────────────────────────────
    section "③ Supabase  —  https://supabase.com/dashboard"
    echo -e "  ${DIM}Supabase stores all pipeline output — holdings, enrichment, analysis reports."
    echo -e "  The free tier is more than sufficient for personal use.${NC}"

    while true; do
        prompt_required SUPABASE_URL \
            "Supabase Project URL" \
            "Format: https://xxxxxxxxxxxxxxxxxxxx.supabase.co  |  Project Settings → API"

        if [[ ! "$SUPABASE_URL" =~ ^https://.+\.supabase\.co$ ]]; then
            warn "  URL should match https://<project-ref>.supabase.co — check for typos."
            continue
        fi

        prompt_required SUPABASE_SERVICE_ROLE_KEY \
            "Supabase Service Role Key" \
            "Project Settings → API → service_role (the secret key, NOT the anon key)" \
            "secret"

        if [[ ! "$SUPABASE_SERVICE_ROLE_KEY" =~ ^eyJ ]]; then
            warn "  Service role key should start with 'eyJ' (it's a JWT) — check you copied the right one."
        fi

        if test_key "Supabase" "supabase" "$SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL"; then
            STATUS[supabase]="ok"
            break
        else
            echo ""
            printf "  Retry Supabase credentials? [Y/n] "
            read -r retry
            if [[ "$retry" =~ ^[Nn]$ ]]; then
                STATUS[supabase]="failed"
                break
            fi
        fi
    done

    # ── SendGrid (optional) ────────────────────────────────────────────────────
    section "④ SendGrid  —  Email notifications  ${DIM}(optional)${NC}"
    echo -e "  ${DIM}Sends you a portfolio analysis report by email after each pipeline run."
    echo -e "  Free tier: 100 emails/day. Create account at app.sendgrid.com${NC}"

    printf "\n  Set up email notifications? [y/N] "
    read -r WANT_EMAIL
    if [[ "$WANT_EMAIL" =~ ^[Yy]$ ]]; then
        while true; do
            prompt_required SENDGRID_API_KEY \
                "SendGrid API Key" \
                "Starts with SG.  |  app.sendgrid.com → Settings → API Keys" \
                "secret"

            if [[ ! "$SENDGRID_API_KEY" =~ ^SG\. ]]; then
                warn "  SendGrid keys start with 'SG.' — check you copied the full key."
                continue
            fi

            if test_key "SendGrid" "sendgrid" "$SENDGRID_API_KEY"; then
                STATUS[sendgrid]="ok"
                break
            else
                echo ""
                printf "  Retry SendGrid key? [Y/n] "
                read -r retry
                if [[ "$retry" =~ ^[Nn]$ ]]; then
                    STATUS[sendgrid]="failed"
                    break
                fi
            fi
        done

        prompt_required SENDGRID_FROM_EMAIL \
            "Sender email address" \
            "Must be verified in SendGrid: app.sendgrid.com → Settings → Sender Authentication"

        prompt_required NOTIFICATION_EMAIL \
            "Recipient email address" \
            "Where to send the portfolio report (usually your own email)"
    else
        SENDGRID_API_KEY=""
        SENDGRID_FROM_EMAIL=""
        NOTIFICATION_EMAIL=""
        STATUS[sendgrid]="skipped"
    fi

    # ── Slack (optional) ───────────────────────────────────────────────────────
    section "⑤ Slack  —  Slack notifications  ${DIM}(optional)${NC}"
    echo -e "  ${DIM}Posts a summary to a Slack channel after each run."
    echo -e "  Create a webhook at: api.slack.com/messaging/webhooks${NC}"

    printf "\n  Set up Slack notifications? [y/N] "
    read -r WANT_SLACK
    if [[ "$WANT_SLACK" =~ ^[Yy]$ ]]; then
        while true; do
            prompt_required SLACK_WEBHOOK_URL \
                "Slack Incoming Webhook URL" \
                "Format: https://hooks.slack.com/services/T.../B.../xxx"

            if [[ ! "$SLACK_WEBHOOK_URL" =~ ^https://hooks\.slack\.com/ ]]; then
                warn "  URL should start with https://hooks.slack.com/services/ — check for typos."
                continue
            fi

            if test_key "Slack" "slack" "$SLACK_WEBHOOK_URL"; then
                STATUS[slack]="ok"
                echo -e "  ${DIM}A test message was posted to your Slack channel.${NC}"
                break
            else
                echo ""
                printf "  Retry Slack webhook? [Y/n] "
                read -r retry
                if [[ "$retry" =~ ^[Nn]$ ]]; then
                    STATUS[slack]="failed"
                    break
                fi
            fi
        done
    else
        SLACK_WEBHOOK_URL=""
        STATUS[slack]="skipped"
    fi

    # ── Pushover (optional) ────────────────────────────────────────────────────
    section "⑥ Pushover  —  Push notifications  ${DIM}(optional)${NC}"
    echo -e "  ${DIM}Sends a push notification to your phone after each run.${NC}"

    printf "\n  Set up Pushover notifications? [y/N] "
    read -r WANT_PUSHOVER
    if [[ "$WANT_PUSHOVER" =~ ^[Yy]$ ]]; then
        prompt_required PUSHOVER_USER_KEY \
            "Pushover User Key" \
            "Found at: pushover.net (top right after login)" \
            "secret"
        prompt_required PUSHOVER_APP_TOKEN \
            "Pushover App Token" \
            "pushover.net → Your Applications → create one for this agent" \
            "secret"
        STATUS[pushover]="saved"
    else
        PUSHOVER_USER_KEY=""
        PUSHOVER_APP_TOKEN=""
        STATUS[pushover]="skipped"
    fi

    # ── Write .env ─────────────────────────────────────────────────────────────
    cat > "$AGENT_DIR/.env" <<EOF
# ── Plaid API ──────────────────────────────────────────────────────────────────
# https://dashboard.plaid.com/developers/keys
PLAID_CLIENT_ID=${PLAID_CLIENT_ID}
PLAID_SECRET=${PLAID_SECRET}
PLAID_ENV=${PLAID_ENV}

# ── Anthropic (Claude) ─────────────────────────────────────────────────────────
# https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# ── Supabase ───────────────────────────────────────────────────────────────────
# https://supabase.com/dashboard → Project Settings → API
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# ── Email notifications (SendGrid) ────────────────────────────────────────────
SENDGRID_API_KEY=${SENDGRID_API_KEY}
SENDGRID_FROM_EMAIL=${SENDGRID_FROM_EMAIL}
NOTIFICATION_EMAIL=${NOTIFICATION_EMAIL}

# ── Slack notifications ────────────────────────────────────────────────────────
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}

# ── Pushover notifications ─────────────────────────────────────────────────────
PUSHOVER_USER_KEY=${PUSHOVER_USER_KEY}
PUSHOVER_APP_TOKEN=${PUSHOVER_APP_TOKEN}
EOF
    info ".env written ✓"

    # ── Summary ────────────────────────────────────────────────────────────────
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  Setup Summary${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    print_status() {
        local label="$1" key="$2"
        case "${STATUS[$key]:-unknown}" in
            ok)      ok "$label" ;;
            failed)  fail "$label — credentials saved but connection failed. Fix in .env and re-run." ;;
            skipped) skip "$label (skipped)" ;;
            saved)   ok "$label (saved, not verified)" ;;
            *)       skip "$label (not configured)" ;;
        esac
    }

    print_status "Plaid" "plaid"
    print_status "Anthropic (Claude)" "anthropic"
    print_status "Supabase" "supabase"
    print_status "SendGrid email" "sendgrid"
    print_status "Slack" "slack"
    print_status "Pushover" "pushover"
    echo ""

    # Warn if any required service failed
    REQUIRED_FAILED=false
    for svc in plaid anthropic supabase; do
        if [[ "${STATUS[$svc]:-}" == "failed" ]]; then
            REQUIRED_FAILED=true
        fi
    done

    if [[ "$REQUIRED_FAILED" == "true" ]]; then
        echo -e "  ${YELLOW}One or more required services failed validation.${NC}"
        echo -e "  Edit ${BOLD}.env${NC} to correct them, then run: ${BOLD}bash install.sh${NC}"
        echo ""
    fi
fi

# ── 6. macOS: optional launchd scheduler ──────────────────────────────────────
if [[ "$(uname)" == "Darwin" ]]; then
    echo ""
    echo -e "${BOLD}macOS scheduler (optional)${NC}"
    echo "  A template launchd plist is at: agent/scheduler/macos/com.finanalyst.pipeline.plist.template"
    echo "  To install (runs Mon/Wed/Fri at 7am):"
    echo ""
    echo "    sed \"s|<PROJECT_DIR>|$AGENT_DIR|g\" agent/scheduler/macos/com.finanalyst.pipeline.plist.template \\"
    echo "        > ~/Library/LaunchAgents/com.finanalyst.pipeline.plist"
    echo "    launchctl load ~/Library/LaunchAgents/com.finanalyst.pipeline.plist"
fi

# ── 7. Linux: cron reminder ───────────────────────────────────────────────────
if [[ "$(uname)" == "Linux" ]]; then
    echo ""
    echo -e "${BOLD}Linux scheduler (optional)${NC}"
    echo "  A crontab example is at: agent/scheduler/linux/crontab.example"
    echo "  Install with: crontab -e"
fi

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Next Steps${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  1. Connect your brokerage accounts (one-time):"
echo "       cd agent && uv run python connect_real_account.py"
echo "       Then open http://localhost:5555 in your browser"
echo ""
echo "  2. Set up the Supabase database schema (one-time):"
echo "       Run supabase/migrations/001_initial_schema.sql in your Supabase SQL editor"
echo ""
echo "  3. Run the pipeline (populates the dashboard with real data):"
echo "       cd agent && uv run python run_pipeline.py"
echo ""
echo "  4. Start the dashboard:"
echo "       npm run dev"
echo "       Then open http://localhost:3000"
echo ""

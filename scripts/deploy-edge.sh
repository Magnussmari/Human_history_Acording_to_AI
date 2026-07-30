#!/usr/bin/env bash
# deploy-edge.sh — ship Chronograph to the sovereign edge (smarason-edge-hel1).
#
# Codifies the runbook that previously lived only as prose in
# Vault-Secrets/Infrastructure/smarason-edge-hel1.md.
#
#   timeline.sumarhus.com -> Caddy vhost -> 127.0.0.1:3001 -> container `timeline-app`
#   compose file: /opt/timeline/docker-compose.yml   image: timeline-edge:v2
#   source clone: /opt/timeline-src  (git pull from origin/main)
#
# Two things make this fiddly, both handled here:
#   1. SSH :22 is firewalled to specific /32s, so a temp hcloud rule is added for
#      the current egress IP and removed again on exit (trap, fires on failure too).
#   2. next build needs ~4G RAM on a cx23, so a temp swapfile is added and removed.
#
# Usage:  scripts/deploy-edge.sh [--dry-run]
set -euo pipefail

SERVER="smarason-edge-hel1"
FIREWALL="smarason-edge-fw"
VAULT_HETZNER="$HOME/Vault-Secrets/Infrastructure/hetzner-access.md"
DRY_RUN="${1:-}"

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

# --- credentials -------------------------------------------------------------
# The vault table uses non-breaking spaces, so parse with python not sed.
HCLOUD_TOKEN="$(python3 -c "
import re,sys
t=open('$VAULT_HETZNER').read()
m=re.search(r'HCLOUD_TOKEN_RW\`?[^|]*\|[^\`]*\`([^\`]+)\`', t)
sys.exit('no HCLOUD_TOKEN_RW in vault') if not m else print(m.group(1))
")"
export HCLOUD_TOKEN

MY_IP="$(curl -fsS ifconfig.me)"
log "egress IP: $MY_IP"

# --- preflight: never deploy an unbuilt or dirty tree -------------------------
log "preflight"
git -C "$(dirname "$0")/.." diff --quiet || { echo "working tree dirty — commit first"; exit 1; }
LOCAL_SHA="$(git -C "$(dirname "$0")/.." rev-parse --short HEAD)"
echo "deploying $LOCAL_SHA"

if [[ "$DRY_RUN" == "--dry-run" ]]; then
  log "dry run — stopping before any remote change"
  exit 0
fi

# --- temp SSH access ---------------------------------------------------------
RULE_ADDED=0
cleanup() {
  if [[ "$RULE_ADDED" == "1" ]]; then
    log "removing temp firewall rule for $MY_IP"
    # Re-apply the rule set without our /32. hcloud has no per-rule delete, so
    # replace_rules with the saved baseline.
    hcloud firewall replace-rules "$FIREWALL" --rules-file /tmp/fw-baseline.json >/dev/null \
      && echo "firewall restored" || echo "WARNING: firewall NOT restored — check manually"
  fi
}
trap cleanup EXIT

log "saving firewall baseline + opening :22 for $MY_IP"
hcloud firewall describe "$FIREWALL" -o json | python3 -c "
import json,sys
fw=json.load(sys.stdin)
json.dump(fw['rules'], open('/tmp/fw-baseline.json','w'), indent=2)
rules=fw['rules']
rules.append({'direction':'in','protocol':'tcp','port':'22',
              'source_ips':['$MY_IP/32'],'destination_ips':[],
              'description':'temp deploy access'})
json.dump(rules, open('/tmp/fw-deploy.json','w'), indent=2)
"
hcloud firewall replace-rules "$FIREWALL" --rules-file /tmp/fw-deploy.json >/dev/null
RULE_ADDED=1
echo "SSH open"

# --- remote build + restart --------------------------------------------------
log "remote: pull, build, restart"
ssh -o ConnectTimeout=20 -o StrictHostKeyChecking=accept-new "root@$SERVER" bash -euo pipefail <<'REMOTE'
  cd /opt/timeline-src
  git fetch --quiet origin main
  git reset --hard origin/main
  echo "at $(git rev-parse --short HEAD)"

  # cx23 has too little RAM for next build; add swap for the duration.
  if [ ! -f /swapfile-build ]; then
    fallocate -l 4G /swapfile-build
    chmod 600 /swapfile-build
    mkswap -q /swapfile-build
    swapon /swapfile-build
    echo "swap on"
  fi
  trap 'swapoff /swapfile-build 2>/dev/null || true; rm -f /swapfile-build' EXIT

  # Derive the image tag from the compose file rather than hardcoding it. The
  # vault runbook said timeline-edge:v2 while compose actually referenced v12,
  # so a "successful" deploy rebuilt an unused tag and left the old container
  # running for 11 days.
  IMAGE=$(grep -E '^\s*image:' /opt/timeline/docker-compose.yml | head -1 | sed -E 's/.*image:\s*//; s/["'"'"']//g')
  echo "compose image: $IMAGE"

  cd /opt/timeline-src/frontend
  docker build -q -t "$IMAGE" .

  cd /opt/timeline
  docker compose up -d --force-recreate
  docker compose ps
REMOTE

# --- verify ------------------------------------------------------------------
log "waiting for healthy container"
ssh "root@$SERVER" 'for i in $(seq 1 30); do
  s=$(docker inspect -f "{{.State.Health.Status}}" timeline-app 2>/dev/null || echo none)
  [ "$s" = healthy ] && { echo healthy; exit 0; }
  sleep 4
done; echo "NOT healthy: $s"; docker logs --tail 40 timeline-app; exit 1'

log "verifying live routes"
FAIL=0
for path in / /updates /methodology /era/era-16 /era/era-120 /year/1610 /data/eras/index.json; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://timeline.sumarhus.com$path")
  printf '  %-28s %s\n' "$path" "$code"
  [[ "$code" == "200" ]] || FAIL=1
done

# Assert the live payload actually changed. Route 200s alone cannot tell a
# fresh deploy from a stale container still happily serving the old build.
read -r LIVE_ERAS LIVE_SCHEMA < <(curl -s https://timeline.sumarhus.com/data/eras/index.json \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['registry']), d.get('schema_version'))")
LOCAL_ERAS=$(python3 -c "import json; print(len(json.load(open('frontend/public/data/eras/index.json'))['registry']))")
echo "  live era index: $LIVE_ERAS eras, schema $LIVE_SCHEMA (local: $LOCAL_ERAS)"
if [[ "$LIVE_ERAS" != "$LOCAL_ERAS" ]]; then
  echo "STALE DEPLOY: live serves $LIVE_ERAS eras but this commit has $LOCAL_ERAS."
  echo "The container is probably running an image tag the build did not update."
  FAIL=1
fi

[[ "$FAIL" == "0" ]] || { echo "SOME ROUTES FAILED"; exit 1; }
log "deployed $LOCAL_SHA — all checked routes 200"
echo "NOTE: HTTP 200 is not visual verification. Look at the pages before calling it done."

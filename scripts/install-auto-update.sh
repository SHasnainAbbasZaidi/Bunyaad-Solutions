#!/usr/bin/env bash
set -euo pipefail
umask 077

if [[ $EUID -ne 0 || $# -ne 2 ]]; then
  echo 'Run: sudo bash scripts/install-auto-update.sh "$(command -v node)" "$(command -v npm)"' >&2
  exit 1
fi
repo=$(pwd -P)
node_path=$1
npm_path=$2
state=/var/lib/bunyaad-auto-update
# The privileged coordinator must not use a user-writable NVM runtime.
coordinator_node=/usr/bin/node
if [[ ! -x "$coordinator_node" || $(stat -Lc '%u' "$coordinator_node") != 0 ]]; then
  echo 'Install system-wide Node.js 24+ at /usr/bin/node before installing the updater.' >&2
  exit 1
fi
"$coordinator_node" --input-type=module -e 'if (Number(process.versions.node.split(".")[0]) < 24) process.exit(1)'
app_user=$(systemctl show bunyaad.service --property=User --value)
working_dir=$(systemctl show bunyaad.service --property=WorkingDirectory --value)
if [[ -z "$app_user" || "$app_user" == root ]]; then
  echo 'bunyaad.service must have a non-root User= before installing automatic updates.' >&2
  exit 1
fi
if [[ "$working_dir" != "$repo" && "$working_dir" != "$state/current" ]]; then
  echo 'Run this installer from the repository used by bunyaad.service.' >&2
  exit 1
fi
[[ -x "$node_path" && -x "$npm_path" && -f .env && -f scripts/auto-update.mjs && -f .next/BUILD_ID ]]
if [[ "$repo$node_path$npm_path" =~ [[:space:]%\"\\] ]]; then
  echo 'Installer requires repository and runtime paths without whitespace, quotes, backslashes, or %.' >&2
  exit 1
fi
app_uid=$(id -u "$app_user")
app_gid=$(id -g "$app_user")
app_home=$(getent passwd "$app_user" | cut -d: -f6)
[[ $(runuser -u "$app_user" -- git branch --show-current) == main ]]
[[ -z $(runuser -u "$app_user" -- git status --porcelain) ]]
runuser -u "$app_user" -- "$node_path" --input-type=module -e 'if (Number(process.versions.node.split(".")[0]) < 24) process.exit(1)'
systemctl is-active --quiet bunyaad.service
curl --fail --silent --max-time 10 http://127.0.0.1:3000/ >/dev/null

install -d -m 755 /usr/local/lib/bunyaad-auto-update "$state" "$state/releases" /etc/systemd/system/bunyaad.service.d
install -m 644 scripts/auto-update.mjs /usr/local/lib/bunyaad-auto-update/update.mjs
"$coordinator_node" --input-type=module - "$repo" "$state" "$node_path" "$npm_path" "$app_user" "$app_uid" "$app_gid" "$app_home" <<'NODE'
import { writeFileSync } from 'node:fs';
const [repo, state, node, npm, user, uid, gid, home] = process.argv.slice(2);
writeFileSync('/etc/bunyaad-auto-update.json', JSON.stringify({repo,state,node,npm,user,uid:Number(uid),gid:Number(gid),home,service:'bunyaad.service'},null,2), {mode:0o600});
NODE
if [[ ! -e "$state/current" ]]; then
  ln -s "$repo" "$state/current"
  runuser -u "$app_user" -- git rev-parse HEAD > "$state/deployed-commit"
  touch "$state/needs-first-release"
fi
# Keep a copy of the existing service configuration for operator recovery.
systemctl cat bunyaad.service > "$state/service-before-install.txt"
cat > /etc/systemd/system/bunyaad.service.d/auto-update.conf <<EOF
[Service]
WorkingDirectory=$state/current
EnvironmentFile=
EnvironmentFile=$state/current/.env
Environment=NODE_ENV=production
ExecStart=
ExecStart=$node_path node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
EOF
cat > /etc/systemd/system/bunyaad-auto-update.service <<EOF
[Unit]
Description=Build, test and deploy Bunyaad updates from GitHub main
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/flock -n $state/update.lock $coordinator_node /usr/local/lib/bunyaad-auto-update/update.mjs
TimeoutStartSec=45min
UMask=0077
EOF
cat > /etc/systemd/system/bunyaad-auto-update.timer <<'EOF'
[Unit]
Description=Check Bunyaad updates at 7 AM and 7 PM Pakistan time

[Timer]
OnCalendar=*-*-* 07:00:00 Asia/Karachi
OnCalendar=*-*-* 19:00:00 Asia/Karachi
AccuracySec=1min
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemd-analyze verify /etc/systemd/system/bunyaad-auto-update.service /etc/systemd/system/bunyaad-auto-update.timer
systemctl daemon-reload
systemctl enable --now bunyaad-auto-update.timer
echo 'Installed. Current app continues running; the next successful update activates the release configuration.'
systemctl list-timers bunyaad-auto-update.timer --no-pager

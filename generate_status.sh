#!/usr/bin/env bash

set -euo pipefail

# Genera status.json para la intranet.
# Esta salida está pensada para ser consumida por index.html/script.js.
# Reemplazar los chequeos proxy de procesos por validaciones más específicas
# si en el futuro se cuenta con endpoints de healthcheck o nombres de servicio estables.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/status.json"

json_escape() {
  local value="${1:-}"
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/ }
  value=${value//$'\r'/ }
  value=${value//$'\t'/ }
  printf '%s' "$value"
}

to_gb() {
  local kib="${1:-0}"
  awk -v value="$kib" 'BEGIN { printf "%.1f", value / 1024 / 1024 }'
}

to_tb() {
  local kib="${1:-0}"
  awk -v value="$kib" 'BEGIN { printf "%.1f", value / 1024 / 1024 / 1024 }'
}

get_meminfo_value() {
  local key="$1"
  awk -v target="$key" '$1 == target ":" { print $2; exit }' /proc/meminfo
}

get_mount_usage_kib() {
  local mount_point="$1"

  if [[ ! -d "$mount_point" ]]; then
    printf '0 0'
    return
  fi

  df -kP "$mount_point" | awk 'NR == 2 { print $2, $3 }'
}

systemd_status() {
  local service_name="$1"

  if ! command -v systemctl >/dev/null 2>&1; then
    printf 'unknown'
    return
  fi

  if systemctl is-active --quiet "$service_name"; then
    printf 'up'
  else
    printf 'down'
  fi
}

process_status() {
  local pattern="$1"

  # Proxy simple: si existe un proceso que coincide con el patrón, se marca como up.
  # Si no, se marca como down. Puede reemplazarse por un chequeo HTTP o systemd real.
  if pgrep -fa "$pattern" >/dev/null 2>&1; then
    printf 'up'
  else
    printf 'down'
  fi
}

MEM_TOTAL_KIB="$(get_meminfo_value MemTotal)"
MEM_AVAILABLE_KIB="$(get_meminfo_value MemAvailable)"

read -r DATOS_TOTAL_KIB DATOS_USED_KIB <<<"$(get_mount_usage_kib /datos)"
read -r BACKUP_TOTAL_KIB BACKUP_USED_KIB <<<"$(get_mount_usage_kib /backup)"
read -r FAST_TOTAL_KIB FAST_USED_KIB <<<"$(get_mount_usage_kib /fast)"

MEMORY_TOTAL_GB="$(to_gb "$MEM_TOTAL_KIB")"
MEMORY_AVAILABLE_GB="$(to_gb "$MEM_AVAILABLE_KIB")"

DATOS_TOTAL_TB="$(to_tb "$DATOS_TOTAL_KIB")"
DATOS_USED_TB="$(to_tb "$DATOS_USED_KIB")"
BACKUP_TOTAL_TB="$(to_tb "$BACKUP_TOTAL_KIB")"
BACKUP_USED_TB="$(to_tb "$BACKUP_USED_KIB")"
FAST_TOTAL_TB="$(to_tb "$FAST_TOTAL_KIB")"
FAST_USED_GB="$(to_gb "$FAST_USED_KIB")"

LOAD_AVERAGE_1M="$(awk '{ printf "%.2f", $1 }' /proc/loadavg)"
UPTIME_HUMAN="$(uptime -p | sed 's/^up //')"
UPDATED_AT="$(date '+%d/%m/%Y %H:%M')"

POSTGRESQL_STATUS="$(systemd_status postgresql)"
DOCKER_STATUS="$(systemd_status docker)"

# Chequeos proxy de aplicaciones.
# Ajustar los patrones si cambian los nombres de procesos o el despliegue.
GEOSERVER_STATUS="$(process_status 'geoserver|java.*geoserver')"
WEBODM_STATUS="$(process_status 'webodm|celery.*webodm|gunicorn.*webodm')"
JUPYTER_STATUS="$(process_status 'jupyter-lab|jupyter-labhub|jupyter-notebook|jupyter-server')"

TMP_FILE="$(mktemp "${OUTPUT_FILE}.tmp.XXXXXX")"

cat >"$TMP_FILE" <<EOF
{
  "memory_total_gb": ${MEMORY_TOTAL_GB},
  "memory_available_gb": ${MEMORY_AVAILABLE_GB},
  "datos_total_tb": ${DATOS_TOTAL_TB},
  "datos_used_tb": ${DATOS_USED_TB},
  "backup_total_tb": ${BACKUP_TOTAL_TB},
  "backup_used_tb": ${BACKUP_USED_TB},
  "fast_total_tb": ${FAST_TOTAL_TB},
  "fast_used_gb": ${FAST_USED_GB},
  "load_average_1m": ${LOAD_AVERAGE_1M},
  "uptime_human": "$(json_escape "$UPTIME_HUMAN")",
  "updated_at": "$(json_escape "$UPDATED_AT")",
  "services": {
    "postgresql": "$(json_escape "$POSTGRESQL_STATUS")",
    "docker": "$(json_escape "$DOCKER_STATUS")",
    "geoserver": "$(json_escape "$GEOSERVER_STATUS")",
    "webodm": "$(json_escape "$WEBODM_STATUS")",
    "jupyter": "$(json_escape "$JUPYTER_STATUS")"
  }
}
EOF

mv "$TMP_FILE" "$OUTPUT_FILE"

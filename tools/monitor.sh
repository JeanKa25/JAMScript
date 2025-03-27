#!/bin/bash

# Configuration
THRESHOLD_CPU=80              # % CPU usage for app-docker.js
THRESHOLD_MEM=400             # MB process memory usage
TOTAL_MEM_THRESHOLD=6000      # System-wide memory usage threshold in MB
LOG_FILE="server_resource_alerts.log"
CHECK_INTERVAL=2              # seconds between checks
PROCESS_NAME="app-docker.js"
STRESS_TEST_SCRIPT="req-jamlist-test.mjs" # change the test script name here...
AUTO_KILL=true

echo "Monitoring $PROCESS_NAME and system memory usage..."
echo "Thresholds:"
echo "- CPU > ${THRESHOLD_CPU}%"
echo "- Process MEM > ${THRESHOLD_MEM}MB"
echo "- System MEM > ${TOTAL_MEM_THRESHOLD}MB"
echo "Logging alerts to: $LOG_FILE"
echo "Auto-kill enabled: $AUTO_KILL"
echo "----------------------------------------------"

while true; do
  SERVER_PID=$(pgrep -f "$PROCESS_NAME")
  STRESS_PID=$(pgrep -f "$STRESS_TEST_SCRIPT")

  if [[ -z "$SERVER_PID" ]]; then
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] $PROCESS_NAME not running." | tee -a "$LOG_FILE"
    sleep $CHECK_INTERVAL
    continue
  fi

  MEM_USED_MB=$(free -m | awk '/Mem:/ {print $3}')
  read CPU_K MEM_K <<< $(ps -p $SERVER_PID -o %cpu=,rss=)
  CPU=$(printf "%.0f" "$CPU_K")
  MEM_MB=$((MEM_K / 1024))

  if [[ "$CPU" -ge "$THRESHOLD_CPU" || "$MEM_MB" -ge "$THRESHOLD_MEM" || "$MEM_USED_MB" -ge "$TOTAL_MEM_THRESHOLD" ]]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$TIMESTAMP] ALERT: PID $SERVER_PID CPU=${CPU}% MEM=${MEM_MB}MB | System MEM=${MEM_USED_MB}MB" | tee -a "$LOG_FILE"

    if [[ "$AUTO_KILL" = true ]]; then
      echo "[$TIMESTAMP] 🔪 Killing $PROCESS_NAME (PID $SERVER_PID)" | tee -a "$LOG_FILE"
      kill -9 "$SERVER_PID" && echo "[$TIMESTAMP] $PROCESS_NAME killed." | tee -a "$LOG_FILE"

      if [[ ! -z "$STRESS_PID" ]]; then
        echo "[$TIMESTAMP] 🔪 Killing stress script (PID $STRESS_PID)" | tee -a "$LOG_FILE"
        kill -9 "$STRESS_PID" && echo "[$TIMESTAMP] Stress script killed." | tee -a "$LOG_FILE"
      else
        echo "[$TIMESTAMP] ℹ️  No stress script running." | tee -a "$LOG_FILE"
      fi
    else
      echo "[$TIMESTAMP] AUTO_KILL is disabled — not killing processes." | tee -a "$LOG_FILE"
    fi
  fi

  if [[ "$MEM_USED_MB" -ge "$TOTAL_MEM_THRESHOLD" ]]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$TIMESTAMP] SYSTEM ALERT: Total memory usage = ${MEM_USED_MB}MB" | tee -a "$LOG_FILE"
  fi

  sleep $CHECK_INTERVAL
done

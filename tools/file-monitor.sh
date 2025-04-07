#!/bin/bash

# CONFIGURATION
TOTAL_MEM_THRESHOLD=6000       # Total system memory in MB
CHECK_INTERVAL=2               # Time between checks (in seconds)
LOG_FILE="filetest_monitor_alerts.log"
TEST_SCRIPT_NAME="file-jamrun-test.mjs"
AUTO_KILL=true

echo "🛡️  Monitoring system memory during file-based JAMScript test..."
echo "Kill threshold: ${TOTAL_MEM_THRESHOLD}MB total system memory"
echo "Logging alerts to: $LOG_FILE"
echo "Auto-kill enabled: $AUTO_KILL"
echo "----------------------------------------------"

while true; do
  TEST_PID=$(pgrep -f "$TEST_SCRIPT_NAME")

  if [[ -z "$TEST_PID" ]]; then
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] $TEST_SCRIPT_NAME not running. Waiting..." | tee -a "$LOG_FILE"
    sleep $CHECK_INTERVAL
    continue
  fi

  MEM_USED_MB=$(free -m | awk '/Mem:/ {print $3}')

  if [[ "$MEM_USED_MB" -ge "$TOTAL_MEM_THRESHOLD" ]]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$TIMESTAMP] SYSTEM MEMORY ALERT: ${MEM_USED_MB}MB used." | tee -a "$LOG_FILE"

    if [[ "$AUTO_KILL" = true ]]; then
      echo "[$TIMESTAMP] Killing test script (PID $TEST_PID)" | tee -a "$LOG_FILE"
      kill -9 "$TEST_PID" && echo "[$TIMESTAMP] $TEST_SCRIPT_NAME killed." | tee -a "$LOG_FILE"
    else
      echo "[$TIMESTAMP] AUTO_KILL is disabled — not killing test." | tee -a "$LOG_FILE"
    fi
  fi

  sleep $CHECK_INTERVAL
done

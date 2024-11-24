#!/bin/bash

# Base command
COMMAND="zx jamrun.mjs jt1.jxe --bg"

# Base app name
APP_PREFIX="DEMO"

# Directory to execute the command (adjust this if necessary)
WORK_DIR="/root/capstone_team/JAMScript/tools"

# Navigate to the working directory
cd "$WORK_DIR" || exit

# Loop from DEMO1 to DEMO100 and execute the command
for i in {1..100}; do
    APP_NAME="${APP_PREFIX}${i}"
    echo "Running command: $COMMAND --app=$APP_NAME"
    $COMMAND --app="$APP_NAME"
done

echo "All commands executed."


#!/bin/bash
# Run the app with error logging
cd "$(dirname "$0")"
LOGFILE="$HOME/Desktop/photopackager_error.log"
echo "Starting PhotoPackager at $(date)" > "$LOGFILE"
./dist/PhotoPackager.app/Contents/MacOS/PhotoPackager 2>> "$LOGFILE"

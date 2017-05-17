#!/bin/bash

#forever -c "node --max-old-space-size=8192" -o out.log -e err.log  bpuContApp.js
forever bpuContApp.js -c "node --max-old-space-size=8192 " --minUptime 1000 --spinSleepTime 1000

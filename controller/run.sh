#!/bin/bash

#forever -c "node --max-old-space-size=8192" -o out.log -e err.log  bpuContApp.js
#forever app.js -c "node --max-old-space-size=8192 " -w --watchDirectory ./
#forever app.js -c "node --max-old-space-size=8192 "

npm install -g pm2
pm2 start app.js --watch && pm2 monit

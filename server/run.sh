#!/bin/bash

#forever -c "node --max-old-space-size=8192" -o out.log -e err.log  app.js
#forever -c "node --max-old-space-size=8192" -w --watchDirectory ./ app.js
forever -c "node --max-old-space-size=8192" -w --watchDirectory ./ -o app.out -e app.err app.js

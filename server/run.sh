#!/bin/bash

#npm install
#npm install -g forever grunt

forever -c "node --max-old-space-size=8192" -w --watchDirectory ./ -o app.out -e app.err app.js

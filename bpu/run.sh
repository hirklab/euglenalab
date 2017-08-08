#!/bin/bash

WHAT_AM_I=$(uname -m)
#echo "$WHAT_AM_I"

if [[ $WHAT_AM_I != 'armv6l' ]];
then
    echo 'emulating RaspberryPi'
    export MACHINE="ubuntu"
else
    echo 'using RaspberryPi'
    export MACHINE="raspberrypi"

    gpio export 3 out
    gpio export 7 out
    gpio export 8 out
    gpio export 9 out
    gpio export 10 out
    gpio export 24 out
    gpio export 25 out
fi

#forever -w --watchDirectory ./ app.js
node app.js
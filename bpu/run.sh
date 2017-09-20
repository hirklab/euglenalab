#!/bin/bash

#$0 - The name of the Bash script.
#$1 - $9 - The first 9 arguments to the Bash script. (As mentioned above.)
#$# - How many arguments were passed to the Bash script.
#$@ - All the arguments supplied to the Bash script.
#$? - The exit status of the most recently run process.
#$$ - The process ID of the current script.
#$USER - The username of the user running the script.
#$HOSTNAME - The hostname of the machine the script is running on.
#$SECONDS - The number of seconds since the script was started.
#$RANDOM - Returns a different random number each time is it referred to.
#$LINENO - Returns the current line number in the Bash script.

set -o nounset
set -o errexit

set -o allexport
source .env
set +o allexport

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
source "$DIR/../includes/bashUtils.sh"

create_serial(){
    FILE=".serial"

    if fileExists $FILE; then
    else
        SERIAL=$(cat /var/lib/dbus/machine-id)
        echo "$SERIAL" > $FILE
    fi
}

write_unique_serial(){
    # Check if default environment file exists
    if fileExists $ENV_DEFAULT_FILE; then
        # Check if user created environment file exists
        if fileExists $ENV_FILE; then
            # overwrite .env file if it exists
            e_note "$ENV_FILE already exists"
            e_note "updating serial number $SERIAL_NUM..."
            sed -i '/UNIQUE_ID/c\UNIQUE_ID="'"$SERIAL_NUM"'"' $ENV_FILE
        else
            cp $ENV_DEFAULT_FILE $ENV_FILE
            e_note "updating serial number $SERIAL_NUM..."
            sed -i '/UNIQUE_ID/c\UNIQUE_ID="'"$SERIAL_NUM"'"' $ENV_FILE
        fi
    else
        e_error "$ENV_DEFAULT_FILE not found!"
    fi
}

real_raspi(){
    e_header 'using RaspberryPi'
    export MACHINE="raspberrypi"

    gpio export 3 out
    gpio export 7 out
    gpio export 8 out
    gpio export 9 out
    gpio export 10 out
    gpio export 24 out
    gpio export 25 out

    SERIAL_NUM=$(cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2)
    e_success "setting up microscope $SERIAL_NUM..."
}

emulate_raspi(){
    e_header 'emulating RaspberryPi'
    export MACHINE="ubuntu"

    create_serial

    SERIAL_NUM=$(cat $FILE)
}

run(){
    if isRaspi; then
        real_raspi
    else
        emulate_raspi
    fi

    write_unique_serial 

    #forever -w --watchDirectory ./ app.js
    node app.js
}


run




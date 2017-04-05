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

file_exists(){
    if [ -f $1 ]
    then
        echo 'Y'
    else
        echo 'N'
    fi
}

SERIAL_NUM=$(cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2)
echo "setting up microscope $SERIAL_NUM..."

ENV_DEFAULT_FILE=".env.default"
ENV_FILE=".env"

# Check if default environment file exists
if [[ $(file_exists $ENV_DEFAULT_FILE) != 'N' ]]
then
    # Check if user created environment file exists
    if [[ $(file_exists $ENV_FILE) != 'Y' ]]
    then
        # overwrite .env file if it exists
        echo "$ENV_FILE already exists"
	echo "updating serial number..."
        sed -i '/UNIQUE_ID/c\UNIQUE_ID="'"$SERIAL_NUM"'"' $ENV_FILE
    else
        cp $ENV_DEFAULT_FILE $ENV_FILE
	echo "updating serial number..."
        sed -i '/UNIQUE_ID/c\UNIQUE_ID="'"$SERIAL_NUM"'"' $ENV_FILE
    fi
else
    echo "$ENV_DEFAULT_FILE not found!"
fi


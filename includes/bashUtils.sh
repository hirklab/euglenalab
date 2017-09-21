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

FALSE=1
TRUE=0

## Adapted from https://natelandau.com/bash-scripting-utilities/

#
#Set Colors
#

bold=$(tput bold)
underline=$(tput sgr 0 1)
reset=$(tput sgr0)


red=$(tput setaf 1)
green=$(tput setaf 76)
yellow=$(tput setaf 226)
white=$(tput setaf 15)

#
# Headers and  Logging
#

e_header() { printf "\n${bold}${white}==========  %s  ==========${reset}\n" "$@" 
}
e_arrow() { printf "➜ $@\n"
}
e_success() { printf "${green}✔ %s${reset}\n" "$@"
}
e_error() { printf "${red}✖ %s${reset}\n" "$@"
}
e_warning() { printf "${yellow}➜ %s${reset}\n" "$@"
}
e_underline() { printf "${underline}${bold}%s${reset}\n" "$@"
}
e_bold() { printf "${bold}%s${reset}\n" "$@"
}
e_note() { printf "${underline}${bold}${white}Note:${reset}  ${white}%s${reset}\n" "$@"
}

# messages
fail() {
  return $FALSE;
}


success() {
  return $TRUE;
}

seek_confirmation() {
  e_bold $@
  read -p " (y/n) " -n 1
  printf "\n"
}

# Test whether the result of an 'ask' is a confirmation
is_confirmed() {
if [[ "$REPLY" =~ ^[Yy]$ ]]; then
  return $TRUE;
fi
return $FALSE;
}


# raspberrypi
isRaspi() {
  output=$(uname -m);
  exitStatus=$?

  if [[ $output == *"arm"* ]]; 
  then 
    return $TRUE;
  else
    return $FALSE;
  fi
}

isRaspiCamera(){
  output=$(vcgencmd get_camera);
  exitStatus=$?

  if [[ $output == *"detected=1"* ]]; 
  then 
    return $TRUE;
  else
    return $FALSE;
  fi
}

cameraExists(){
  cmd="$1"
  output=$(cmdExists $cmd);
  exitStatus=$?

  if [[ $exitStatus -ne 0 ]]; then 
    e_error $output
    return $FALSE;
  else
    return $TRUE;
  fi
}

# permissions
setUserOwnership() {
  cmd="$1: $2"
  output=$(sudo chown -R $cmd 2>&1);
  exitStatus=$?

  if [[ $exitStatus -ne 0 ]]; then 
    e_error $output
    return $FALSE;
  else
    return $TRUE;
  fi
}

setGroupOwnership() {
  cmd=":$1 $2"
  output=$(sudo chown -R $cmd 2>&1);
  exitStatus=$?

  if [[ $exitStatus -ne 0 ]]; then 
    e_error $output
    return $FALSE;
  else
    return $TRUE;
  fi
}

setAllOwnership() {
  cmd="777 $1"
  output=$(sudo chmod $cmd 2>&1);
  exitStatus=$?

  if [[ $exitStatus -ne 0 ]]; then 
    e_error $output
    return $FALSE;
  else
    return $TRUE
  fi
}

#File System
cmdExists() {
  if [ -c $1 ]; then 
    return $TRUE; 
  else 
    return $FALSE; 
  fi
}

fileExists() {
  if [ -f $1 ]; then 
    return $TRUE; 
  else 
    return $FALSE; 
  fi
}

dirExists() {
  if [ -d "$1" ];
  then 
    return $TRUE; 
  else 
    return $FALSE; 
  fi
}

copyDirTo() {
  output=$(cp -r $1 $2 2>&1);
  exitStatus=$?
  if [[ $exitStatus -ne 0 ]]; 
  then 
    e_error $output
    return $FALSE;
  else
    return $TRUE;
  fi
}

createDir() {
  output=$(mkdir -p $1 2>&1);
  exitStatus=$?
  if [[ $exitStatus -ne 0 ]]; 
  then 
    e_error $output
    return $FALSE;
  else
    return $TRUE;
  fi
}

removeDir() {
  #Check Folder 
  exitStatus=$(dirExists $1)
  if [[ $exitStatus -ne 0 ]];
  then
    return $TRUE
  else
    output=$(rm -r $1 2>&1);
    exitStatus=$?
    if [[ $exitStatus -ne 0 ]]; 
    then 
      e_error $output
      return $FALSE;
    else
      return $TRUE;
    fi
  fi
}

recreateDir() {
  # remove Folder 
  exitStatus=$(removeDir $tempFolder)
  if [[ $exitStatus -ne 0 ]];
  then
    e_error $exitStatus
    return $FALSE;
  else

    # create Folder  
    exitStatus=$(createDir $tempFolder)
    if [[ $exitStatus -ne 0 ]];
    then
      e_error $exitStatus
      return $FALSE;
    else

      # set Permissions
      exitStatus=$(setAllOwnership $tempFolder)
      if [[ $exitStatus -ne 0 ]];
      then
        e_error $exitStatus
        return $FALSE;
      else
        return $TRUE;
      fi

    fi
  fi
}

#Mounting
isMountedDir() {
  if mount | grep $1 > /dev/null; 
  then 
    return $TRUE;
  else 
    return $FALSE; 
  fi
}

mountRemoteToLocal() {
  output=$(eval sudo mount $2 $1 2>&1)
  exitStatus=$?
  if [[ $exitStatus -ne 0 ]]; 
  then 
    e_error $exitStatus
    return $FALSE;
  else
    return $TRUE;
  fi
}

createLocalMountDirAndMount() {
  #Create Local for Mount
  exitStatus=$(createDir $1)
  if [[ $exitStatus -ne 0 ]];
  then
    e_error "failed to create local mount point at $1"
  else

    #Do Mount
    exitStatus=$(mountRemoteToLocal $1 $2)
    if [[ $exitStatus -ne 0 ]];
    then
      e_error "failed to mount remote $2 to local $1"
    else
      return $TRUE;
    fi
  fi
}

# File IO
readFile() {
  while IFS='' read -r line || [[ -n "$line" ]]; do
      echo $line
  done < "$1"
}

# Awk
awkFileForLineMatch() {
  re="/$2/"
  echo $(awk $re'{ print }' < $1)
}

# Regular Expressions
checkArrayForStringMatch() {
  arr=("$@")
  ((last_idx=${#arr[@]} - 1))
  sstr=${arr[last_idx]}
  unset arr[last_idx]
  for each in "${arr[@]}"
  do
    if [[ "$each" =~ "$sstr" ]];
    then
      echo $each | cut -d':' -f 2
    fi
  done
}

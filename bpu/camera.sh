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

# variables
set -o nounset
set -o errexit

set -o allexport
source .env
set +o allexport

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
source "$DIR/../includes/bashUtils.sh"

IS_RASPI_CAMERA=1

createMountedFolder(){
  e_header "mount operations"
  if isMountedDir $LOCAL_MOUNT_ADDR; then
    if createDir $DATA_ADDR; then
      if setGroupOwnership $GROUP_FOR_PERMISSIONS $DATA_ADDR; then
        e_error "failed to set group ownership on $DATA_ADDR"
        return 1
      else
        return 0
      fi
    else
      e_error "failed to create data folder at $DATA_ADDR"
      return 1
    fi
  else
    e_error "mount failed for $LOCAL_MOUNT_ADDR"
    return 1
  fi
}

createTempDataFolder(){
  if createDir $TEMP_DATA_ADDR; then
    return 0
  else
    e_error "failed to create temporary data folder at $TEMP_DATA_ADDR"
    return 1
  fi
}

createCameraConfig(){
  if isRaspi; then
    IS_RASPI_CAMERA=0
  fi

  timestamp=$(date)
  timestamp=${timestamp// /_}

  outpath=$DATA_ADDR'/'$CAMERA_CONFIG_FILE

  outputstr=$"timestamp:$timestamp\n"
  outputstr=$outputstr$"inFPS:$FPS\n"
  outputstr=$outputstr$"inX:$WIDTH\n"
  outputstr=$outputstr$"inY:$HEIGHT\n"
  outputstr=$outputstr$"outHttpPort:$CAMERA_LOCAL_PORT\n"
  outputstr=$outputstr$"outHttpWeb:$CAMERA_WEB_PATH\n"
  outputstr=$outputstr$"outFilePath:$CAMERA_DATA_LOCATION\n"
  outputstr=$outputstr$"outFileMs:$CAMERA_FILE_MS\n"
  outputstr=$outputstr$"isRaspPiCam:$IS_RASPI_CAMERA\n"
  outputstr=$outputstr$"localDataLocation:$DATA_ADDR\n"
  outputstr=$outputstr$"hostname:$HOSTNAME\n"
  outputstr=$outputstr$"user:$USER\n"

  echo -e $outputstr > $outpath

  if [ $? -eq 0 ];
  then
    return 0
  else
    e_error "failed to write camera config"
    return 1
  fi
}

startCamera(){
  FPS=15
  WIDTH=640
  HEIGHT=480
  CAMERA_LOCAL_PORT=8080
  CAMERA_WEB_PATH="../bpu/ImageStreamer/www"
  CAMERA_DATA_LOCATION=$DATA_ADDR
  CAMERA_DEVICE="/dev/video0"
  CAMERA_CONFIG_FILE="cameraConfig.cnf"
  CAMERA_FILE_MS=100
  CAMERA_RASPI_LIB="./ImageStreamer/input_raspicam.so"
  CAMERA_UVC_LIB="./ImageStreamer/input_uvc.so"
  CAMERA_HTTP_LIB="./ImageStreamer/output_http.so"
  CAMERA_FILE_LIB="./ImageStreamer/output_file.so"

  INPUT="-fps $FPS -x $WIDTH -y $HEIGHT"

  OUT_WEB="-p $CAMERA_LOCAL_PORT -w $CAMERA_WEB_PATH"
  OUT_FILE="-f $CAMERA_DATA_LOCATION -d $CAMERA_FILE_MS"

  if [ $IS_RASPI_CAMERA -eq 0 ]; then
    ##original##./mjpg_streamer -i './input_raspicam.so -fps 15  -x 640 -y 480' -o './output_http.so -p 8080 -w ./www' -o './output_file.so -f /myData/bpu/images -d 100'
    CAMERA_LIB=CAMERA_RASPI_LIB
  else
    ##original##./mjpg_streamer -i './input_uvc.so -d /dev/video0 -f 15 -r 640x480' -o './output_http.so -p 8080 -w ./www' -o './output_file.so -f /myData/bpu/images -d 100'
    
    local separator="x"
    INPUT="-d $CAMERA_DEVICE -f $FPS -r $WIDTH$separator$HEIGHT"

    CAMERA_LIB=CAMERA_UVC_LIB
  fi   

  ./ImageStreamer/mjpg_streamer -i "$CAMERA_LIB $INPUT" -o "$CAMERA_HTTP_LIB $OUT_WEB" -o "$CAMERA_FILE_LIB $OUT_FILE"
  return 0
}

run(){
  if createMountedFolder; then
    if createTempDataFolder; then
      if createCameraConfig; then
        if startCamera; then
        else
          e_error "failed to start camera"
        fi
      else
        e_error "failed to write camera config"
      fi
    else
      e_error "failed to create temporary data folder"
    fi
  else
    e_error "failed to create and mount folder"
  fi
}


run

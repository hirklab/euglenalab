#!/bin/bash

# Check deployment.js
set -o allexport
source .env
set +o allexport

# Reseting the iptable
sudo iptables --policy INPUT   ACCEPT;
sudo iptables --policy OUTPUT  ACCEPT;
sudo iptables --policy FORWARD ACCEPT;

sudo iptables -Z; # zero counters
sudo iptables -F; # flush (delete) rules
sudo iptables -X; # delete all extra chains

# For the webserver for external and internal packets
sudo iptables -t nat -A PREROUTING -p tcp --dport $WEB_PUBLIC_PORT -j REDIRECT --to-port $WEB_LOCAL_PORT
sudo iptables -t nat -I OUTPUT -p tcp -o lo --dport $WEB_PUBLIC_PORT -j REDIRECT --to-ports $WEB_LOCAL_PORT

sudo iptables -t nat -A PREROUTING -p tcp --dport $CONTROLLER_PUBLIC_PORT -j DNAT --to $WEB_LOCAL_IP:$CONTROLLER_LOCAL_PORT
sudo iptables -A FORWARD -d $WEB_LOCAL_IP -p tcp --dport $CONTROLLER_LOCAL_PORT -j ACCEPT

echo "Setting up Camera Output Ports"
for bpu in $BPU_LIST
do
    echo $((CAMERA_PUBLIC_PORT+5*bpu))
    echo 192.168.1.$((bpu + 200))

    # For the BPU Cameras for external packets
    sudo iptables -t nat -A PREROUTING -p tcp --dport $((CAMERA_PUBLIC_PORT+5*bpu)) -j DNAT --to 192.168.1.$((bpu + 200)):$CAMERA_LOCAL_PORT

    # Enabling port forwarding for the BPUs
    sudo iptables -A FORWARD -d 192.168.1.$((bpu + 200)) -p tcp --dport $CAMERA_LOCAL_PORT -j ACCEPT
done

sudo iptables -t nat -A POSTROUTING -j MASQUERADE

echo "Setting up Camera Input Ports"
for bpu in $BPU_LIST
do
    # For the BPU Cameras for internal packets
    sudo iptables -t nat -I OUTPUT -p tcp -o lo --dport $((CAMERA_PUBLIC_PORT+5*bpu)) -j DNAT --to 192.168.1.$((bpu + 200)):$CAMERA_LOCAL_PORT
done

# So that Public IP addresses works internally too
sudo iptables -t nat -I OUTPUT -p tcp -d $WEB_PUBLIC_IP -j DNAT --to $WEB_LOCAL_IP
sudo iptables -t nat -I OUTPUT -p tcp --dport $WEB_PUBLIC_PORT -d $WEB_PUBLIC_IP -j DNAT --to $WEB_LOCAL_IP:$WEB_LOCAL_PORT
sudo iptables -t nat -I OUTPUT -p tcp --dport $CONTROLLER_PUBLIC_PORT -d $WEB_PUBLIC_IP -j DNAT --to $WEB_LOCAL_IP:$CONTROLLER_LOCAL_PORT

for bpu in $BPU_LIST
do
    # For the BPU Cameras for internal packets
    sudo iptables -t nat -I OUTPUT -p tcp --dport $((CAMERA_PUBLIC_PORT+5*bpu)) -d $WEB_PUBLIC_IP -j DNAT --to 192.168.1.$((bpu + 200)):$CAMERA_LOCAL_PORT
done

sudo sysctl net.ipv4.ip_forward=1
#!/bin/sh
echo "Executing preinstaller script for custom installer"

# Deleting App components from Application folder.
echo "Deleting Audio-Configration Logs"
logsPath=~/Library/Logs/Audio-Configration
if [ -d "$logsPath" ]
then
rm -rf ~/Library/Logs/Audio-Configration
echo "***Deleted Audio-Configration Logs Successfully***"
fi

echo "Deleting Audio-Configration Application Support"
applicationSupportPath=~/Library/Application\ Support/Audio-Configration
if [ -d "$applicationSupportPath" ]
then
rm -rf ~/Library/Application\ Support/Audio-Configration
echo "***Deleted Audio-Configration Application Support Successfully***"
fi

echo "Finished:preflight"
exit 0

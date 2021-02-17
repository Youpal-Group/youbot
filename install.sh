#!/bin/sh
echo Install Youbot

yarn install

echo Build Youbot

yarn build

echo Install Adapter RocketChat

yarn --cwd ./adapters/rocketchat/ install

echo Build Adapter RocketChat

yarn --cwd ./adapters/rocketchat/ build

echo Install Bot BotPress

yarn --cwd ./bots/botpress/ install

echo Build Bot BotPress

yarn --cwd ./bots/botpress/ build

echo Now you can start Youbot with start script or with dev script
# Youbot

Advanced middleware for bots and channels with database support written in TypeScript.

## Workflow
![workflow of youbot][workflow.jpeg]

## Installation

- Install (`yarn install`) and build (`yarn build`).
- Install (`yarn install`) and build (`yarn build`) all adapters and bots in respective directories.
- Setup all config.json files (root, adapters and bots directories).

## Create Middlewares and Scripts

Both are scripts and they are in separate directories for human logic.
If you want to create a new script:

- Create new directory in middlewares or scripts and name it with the name of your script.
- In root category you will find scripts.json or middlewares.json. You must add there your new script if you want to enable it.
- All scripts execute in sequence and json list determines the order.
- In your script directory you need at least one file with name index.js.
- For more details check scripts/example-script.

#### Errors

On error `Cannot read property '_id' of undefined`

- Go to `/adapters/rocketchat/node_modules/@rocket.chat/sdk/dist/lib/driver.js` after line 355 add the code `message = message.shift();`

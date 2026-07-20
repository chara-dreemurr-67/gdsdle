# gdsdle
Can you guess that level 50+ GDS member?

## Attribution
Shoutout to [GDjkhp](https://github.com/GDjkhp)'s and his [message](https://discord.com/channels/398627612299362304/1373749191842463847/1527191201189593239).

## Build Instructions
### Prerequisites
1. [Git](https://git-scm.com/). (why are you even on github without git)
2. [Node.js](https://nodejs.org/en/download). (and also npm but that should come with node, i think)
3. A [Discord](https://discord.com/developers/applications/) bot token.

### Build
1. Install dependencies:
```bash
npm install
```
2. Build:
```bash
npm run build
```

### After Building
1. Create a file named ".env" and put it in public/ (or whatever folder the main.js file is in, but it should be public/ by default). The file should look something like this:
```txt
# required:
DISCORD_TOKEN= # bot token. do not fucking share this shit with anyone that has no business having it
SERVER_ID= # server to retrive player from, only works if the server exists and use mee6 leveling
CLIENT_ID= # bot id

# optional:
ADMINISTRATOR_IDS= # an array of ids of bot admins as strings. this is an empty array by default
MAX_TRIES= # maximum number of tries for a player. default is 5
TIMEOUT_DURATION= # timeout after deleting account. default is 604800 seconds, or 1 week
```
2. Register your bot's command: (Note: rerun this every time you modified the commands' property (name, description, options), or just make it run every time the bot starts)
```bash
npm run deploy
```
3. To start the build:
```bash
npm run start
```
4. Alternatively, run without building:
```bash
npm run dev
```

## License
This project is licensed under the [GNU General Public License 3.0](LICENSE).
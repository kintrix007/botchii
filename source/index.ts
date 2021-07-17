import { initBot } from "./_core/bot_core";
import path from "path";

initBot(
    {},
    {
        defaultPrefix: ".",
        messageContentModifiers: [
            x => x.toLowerCase(),
        ],
        commandDirs: [
            path.join(__dirname, "bot_commands", "announce"),
        ],
        defaultCommands: [ "announce", "help" ],
        options: {
            disableMentions: "everyone",
        },
        onready: data => {
            console.log(`Current time: ${Date()}`);
        },
    },
);

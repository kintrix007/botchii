import { initBot } from "./_core/bot_core";
import path from "path";

initBot(
    {},
    {
        defaultPrefix: ".",
        options: {
            disableMentions:      "everyone",
            messageCacheLifetime: 60*60*60*24*7, // a week
            messageSweepInterval: 60*60*60       // an hour
        },
        commandDirs: [
            path.join(__dirname, "bot_commands", "announce")
        ],
        onready: data => {
            console.log(`Current time: ${Date()}`);
        }
    }
);

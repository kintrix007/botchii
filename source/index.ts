import { initBot } from "./_core/bot_core";
import path from "path";

initBot(
    {},
    {
        defaultPrefix: ".",
        options: {
            disableMentions: "everyone"
        },
        commandDirs: [
            path.join(__dirname, "bot_commands", "announce")
        ],
        onready: data => {
            console.log(`Current time: ${Date()}`);
        }
    }
);

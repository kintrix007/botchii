import { initBot } from "./_core/bot_core";
import path from "path";

initBot(
    {
        defaultPrefix: ".",
        commandDirs: [
            path.join(__dirname, "bot_commands")
        ]
    },
    {}
);

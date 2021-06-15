import * as BotUtils from "../bot_utils";
import { Command, CommandCallData } from "../types";

const cmd: Command = {
    call: cmdKill,
    name: "shutdown",
    permissions: [ BotUtils.ownerPermission ],
    aliases: [ "kill" ],
    group: "owner",
    examples: [ [] ],
};

function cmdKill({ msg }: CommandCallData) {
    BotUtils.sendEmbed(msg, "ok", {
        title: "Shutting down..."
    }).then(sentMsg => {
        console.log("stopping bot...");
        process.exit(0);
    }).catch(console.error);
}

module.exports = cmd;

import { Command, CommandCallData, ownerPermission, sendEmbed } from "../bot_core";

export default {
    call: cmdKill,
    name: "shutdown",
    permissions: [ ownerPermission ],
    group: "owner",
    examples: [ [] ],
} as Command;

function cmdKill({ msg }: CommandCallData) {
    sendEmbed(msg, "ok", {
        title: "Shutting down..."
    }).then(sentMsg => {
        console.log("stopping bot...");
        process.exit(0);
    }).catch(console.error);
}

import * as CoreTools from "../core_tools";
import * as types from "../types";
import { MessageEmbed } from "discord.js";

const cmd: types.Command = {
    func: cmdKill,
    name: "shutdown",
    permissions: [ types.ownerPermission ],
    aliases: [ "restart", "kill" ],
    group: "owner",
    usage: "shutdown",
    examples: [ "" ],
};

function cmdKill({ msg }: types.CombinedData) {    
    const embed = new MessageEmbed()
        .setColor(0x00bb00)
        .setTitle("Shutting down... (restart)");
    
    msg.channel.send(embed).then(sentMsg => {
        console.log("-- stopping bot... --");
        process.exit(0);
    }).catch(console.error);
}

module.exports = cmd;

import * as CoreTools from "../core_tools";
import * as types from "../types";
import { MessageEmbed } from "discord.js";

const cmd: types.Command = {
    func: cmdKill,
    name: "restart",
    permissions: [ types.ownerPermission ],
    aliases: [ "shutdown", "kill" ],
    group: "owner",
    // usage: "restart",
    examples: [ "" ],
};

function cmdKill({ msg }: types.CombinedData) {    
    const embed = CoreTools.createEmbed("ok", {
        title: "Shutting down... (restart)"
    });
    
    msg.channel.send(embed).then(sentMsg => {
        console.log("-- stopping bot... --");
        process.exit(0);
    }).catch(console.error);
}

module.exports = cmd;

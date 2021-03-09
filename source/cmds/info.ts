import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import * as fs from "fs";
import * as path from "path";
import { MessageEmbed } from "discord.js";

const cmd: types.Command = {
    func: cmdInfo,
    name: "botinfo",
    usage: "botinfo",
    examples: [ "" ]
}

function cmdInfo({ msg }: types.CombinedData) {
    const packagePath = path.join(Utilz.rootDir, "package.json");
    const packageObj = JSON.parse(fs.readFileSync(packagePath).toString());
    const name: string = Utilz.capitalize(packageObj.name);
    const description: string = packageObj.description;
    const homepage: string    = packageObj.homepage;
    
    const embed = new MessageEmbed()
        .setColor(0x00bb00)
        .setTitle(name)
        .setDescription(`${description}\n**GitHub:** ${homepage}`);
    msg.channel.send(embed);

    console.log(`${msg.author.username}#${msg.author.discriminator} queried the info about the bot`);
}

module.exports = cmd;

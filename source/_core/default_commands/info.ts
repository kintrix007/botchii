import * as CoreTools from "../core_tools";
import * as types from "../types";
import * as fs from "fs";
import * as path from "path";

const cmd: types.Command = {
    func: cmdInfo,
    name: "botinfo",
    usage: "botinfo",
    examples: [ "" ]
}

function cmdInfo({ msg }: types.CombinedData) {
    const packagePath = path.join(CoreTools.ROOT_DIR, "package.json");
    const packageObj = JSON.parse(fs.readFileSync(packagePath).toString());
    const name: string = CoreTools.capitalize(packageObj.name);
    const description: string = packageObj.description;
    const homepage: string    = packageObj.homepage;
    
    const embed = CoreTools.createEmbed("neutral", {
        title: name,
        desc:  description + "\n**GitHub: **" + homepage
    });
    msg.channel.send(embed);
    console.log(`${msg.author.username}#${msg.author.discriminator} queried the info about the bot`);
}

module.exports = cmd;

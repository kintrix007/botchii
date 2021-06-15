import * as BotUtils from "../bot_utils";
import { Command, CommandCallData } from "../types";
import * as fs from "fs";
import * as path from "path";

const cmd: Command = {
    call: cmdInfo,
    name: "botinfo",
    usage: "botinfo",
    description: "Shows some basic information about the bot.",
    examples: [ [] ]
}

function cmdInfo({ msg }: CommandCallData) {
    const packagePath = path.join(BotUtils.ROOT_DIR, "package.json");
    const packageObj = JSON.parse(fs.readFileSync(packagePath).toString());
    const name: string = BotUtils.capitalize(packageObj.name);
    const description: string = packageObj.description;
    const homepage: string    = packageObj.homepage;
    
    BotUtils.sendEmbed(msg, "neutral", {
        title: name,
        desc:  description + (homepage ? "\n**GitHub: **" + homepage : "")
    });
}

module.exports = cmd;

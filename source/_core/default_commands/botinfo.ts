import { ROOT_DIR, capitalize, sendEmbed, Command, CommandCallData } from "../bot_core";
import * as fs from "fs";
import * as path from "path";

export default {
    call: cmdInfo,
    name: "botinfo",
    usage: "botinfo",
    group: "help",
    description: "Shows some basic information about the bot.",
    examples: [ [] ]
} as Command;

function cmdInfo({ msg }: CommandCallData) {
    const packagePath = path.join(ROOT_DIR, "package.json");
    const packageObj = JSON.parse(fs.readFileSync(packagePath).toString());
    const name: string = capitalize(packageObj.name);
    const description: string = packageObj.description;
    const homepage: string    = packageObj.homepage;
    
    sendEmbed(msg, "neutral", {
        title: name,
        desc:  description + (homepage ? "\n**GitHub: **" + homepage : "")
    });
}

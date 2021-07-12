import { ROOT_DIR, capitalize, Command, CommandCallData } from "../bot_core";
import * as fs from "fs";
import * as path from "path";
import { createEmbed } from "_core/dc_utils";

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
    
    return createEmbed("neutral", {
        title: name,
        desc:  description + (homepage ? "\n**GitHub: **" + homepage : "")
    });
}

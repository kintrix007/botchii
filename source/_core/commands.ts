import * as types from "./types";
import * as CoreTools from "./core_tools";
import fs from "fs";
import path from "path";
import { Message, MessageEmbed, DMChannel, Collection } from "discord.js";

const cmds = new Set<types.Command>();

function createCmd(command: types.Command): void {
    console.log(`loaded command '${command.name}'`);

    cmds.add(command);
}

function loadCmds(cmds_dir: string) {
    console.log("-- started loading commands... --");

    const files = fs.readdirSync(cmds_dir)
        .filter(filename => filename.endsWith(".js"))
        .map(filename => filename.slice(0, filename.length-3));

    files.forEach(filename => {
        const cmdPath = path.join(cmds_dir, filename)
        const command: types.Command = require(cmdPath);
        createCmd(command);
    });

    console.log("-- finished loading commands --");
}

async function setUpCmds(data: types.Data) {
    console.log("-- started setting up commands... --");

    for (const cmd of cmds) {
        await cmd.setupFunc?.(data);
    }
    
    console.log("-- finished setting up commands --");
}

export async function createCmdsListeners(data: types.Data, cmds_dirs: string[]) {
    cmds_dirs.forEach(dir => loadCmds(dir));
    // console.log(cmds);
    await setUpCmds(data);

    data.client.on("message", (msg: Message) => {
        if (msg.channel instanceof DMChannel) return;
        if (msg.author.bot) return;
        const cont = CoreTools.prefixless(data, msg);
        if (!cont) return;
        const [commandName, ...args] = cont.trim().split(" ").filter(x => x !== "");
        const combData: types.CombinedData = {
            data: data,
            msg: msg,
            cmdName: commandName,
            args: args,
            argsStr: args.join(" "),
            cont: cont
        }

        cmds.forEach(cmd => {
            if (
                CoreTools.removeAccents(cmd.name.toLowerCase()) === commandName ||
                cmd.aliases?.map(x => CoreTools.removeAccents(x.toLowerCase()))?.includes(commandName)
            ) {
                const notPermitted = cmd.permissions?.find(({ func }) => !func(msg));

                if (notPermitted) {
                    const description = notPermitted.errorMessage?.(combData) ?? "You do not have permission to use this command.";
                    const embed = new MessageEmbed()
                        .setColor(0xbb0000)
                        .setDescription(description);
                    msg.channel.send(embed);
                    return;
                }

                cmd.func(combData);
            }
        });
    });

    console.log("-- all message listeners set up --");
}

export function getCmdList(onlyCommandsWithUsage = true) {
    return Array.from(cmds.values()).filter(x => x.usage || !onlyCommandsWithUsage);
}

export function getPermittedCmdList(msg: Message, onlyListAvailable = true): types.Command[] {
    const hasPerms = (x: types.Command) => !x.permissions?.some(({ func }) => !func(msg))
    return Array.from(cmds.values()).filter(x => x.usage && (hasPerms(x) || !onlyListAvailable));
}

export function getHelpCmd() {
    return Array.from(cmds.values()).find(x => x.group === "help");
}

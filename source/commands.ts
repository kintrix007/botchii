import * as types from "./classes/types";
import * as Utilz from "./classes/utilz";
import * as fs from "fs";
import { Message, MessageEmbed, DMChannel } from "discord.js";
import * as path from "path";

const cmds: types.Command[] = [];

function createCmd(command: types.Command): void {
    console.log(`loaded command '${command.name}'`);

    if (command.group === "help") {
        cmds.unshift(command);      // unshift = prepend
    } else {
        cmds.push(command);
    }
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

    for (let cmd of cmds) {
        if (cmd.setupFunc) {
            await cmd.setupFunc(data);
        }
    }
    
    console.log("-- finished setting up commands --");
}

export async function createCmdsListeners(data: types.Data, cmds_dir: string) {
    loadCmds(cmds_dir);
    // console.log(cmds);
    await setUpCmds(data);

    data.client.on("message", (msg: Message) => {
        if (msg.channel instanceof DMChannel) return;
        if (msg.author.bot) return;
        const cont = Utilz.prefixless(data, msg);
        if (!cont) return;
        const [commandName, ...args] = cont.trim().split(" ").filter(x => x !== "");
        const combData: types.CombinedData = {
            data: data,
            msg: msg,
            args: args,
            cmdStr: commandName,
            argsStr: args.join(" "),
            cont: cont
        }

        cmds.forEach(cmd => {
            if (
                Utilz.removeAccents(cmd.name.toLowerCase()) === commandName ||
                cmd.aliases?.map(x => Utilz.removeAccents(x.toLowerCase()))?.includes(commandName)
            ) {
                // if admin command called by non-admin, return
                if (cmd.adminCommand && !Utilz.isAdmin(msg.member)) {
                    const embed = new MessageEmbed()
                        .setColor(0xbb0000)
                        .setDescription(`A \`${commandName}\` can only be used by admins.`);
                    msg.channel.send(embed);
                    return;
                }
                if (cmd.ownerCommand && !Utilz.isBotOwner(msg.author)) {
                    const embed = new MessageEmbed()
                        .setColor(0xbb0000)
                        .setDescription(`A \`${commandName}\` can only be used by the bot's owner.`);
                    msg.channel.send(embed);
                    return;
                }

                cmd.func(combData);
            }
        });
    });

    console.log("-- all message listeners set up --");
}

export function getCmdList(adminExcluded = false): types.Command[] {
    return cmds.filter(x => x.usage !== undefined && (adminExcluded && !x.adminCommand || !adminExcluded));
}

export function getHelpCmd() {
    return cmds.find(x => x.group === "help");
}

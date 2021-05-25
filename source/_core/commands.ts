import * as types from "./types";
import * as CoreTools from "./core_tools";
import fs from "fs";
import path from "path";
import { Message, DMChannel } from "discord.js";

const DEAULT_NOT_PERMITTED_ERROR_MESSAGE = "You do not have permission to use this command."
const cmds = new Set<types.Command>();

export async function createCmdsListeners(data: types.Data, cmdDirs: string[]) {
    cmdDirs.forEach(dir => loadCmds(dir));
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
                cmd.name === commandName || cmd.aliases?.includes(commandName)
            ) {
                const notPermitted = cmd.permissions?.find(({ func }) => !func(msg));

                if (notPermitted) {
                    const description = notPermitted.errorMessage?.(combData) ?? DEAULT_NOT_PERMITTED_ERROR_MESSAGE;
                    CoreTools.sendEmbed(msg, "error", description);
                    return;
                }

                cmd.func(combData);
            }
        });
    });

    console.log("-- all message listeners set up --");
}

function loadCmds(cmdDir: string) {
    console.log(`-- loading commands from '${path.basename(cmdDir)}'... --`);

    const withoutExt = (filename: string) => filename.slice(0, filename.length - path.extname(filename).length);

    const files = fs.readdirSync(cmdDir)
        .filter(filename => !fs.lstatSync(path.join(cmdDir, filename)).isDirectory())
        .map(withoutExt);

    files.forEach(filename => {
        const cmdPath = path.join(cmdDir, filename)
        const command: types.Command = require(cmdPath);
        if (command?.name == undefined) return;
        createCmd(command);
    });
}

function createCmd(command: types.Command): void {
    console.log(`loaded command '${command.name}'`);

    const convertedCommand: types.Command = {
        setupFunc:   command.setupFunc,
        func:        command.func,
        name:        CoreTools.removeAccents(command.name.toLowerCase()),
        aliases:     command.aliases?.map(alias => CoreTools.removeAccents(alias.toLowerCase())),
        permissions: command.permissions,
        group:       command.group,
        usage:       command.usage,
        description: command.description,
        examples:    command.examples
    };

    cmds.add(convertedCommand);
}

async function setUpCmds(data: types.Data) {
    console.log("-- started setting up commands... --");

    for (const promise of [...cmds].map(cmd => cmd.setupFunc?.(data))) await promise;
    
    console.log("-- finished setting up commands --");
}


export function getCmdList(onlyCommandsWithUsage = true) {
    return [...cmds].filter(x => x.usage || !onlyCommandsWithUsage);
}

export function getPermittedCmdList(msg: Message, onlyListAvailable: boolean): types.Command[] {
    const hasPerms = (x: types.Command) => !x.permissions?.some(({ func }) => !func(msg));
    return [...cmds].filter(x => !!x.usage && (!onlyListAvailable || hasPerms(x)));
}

export function getCmd(cmdName: string) {
    return getCmdList().find(cmd => cmd.name === cmdName || cmd.aliases?.includes(cmdName));
}

export function getHelpCmd() {
    return Array.from(cmds.values()).find(x => x.group === "help");
}

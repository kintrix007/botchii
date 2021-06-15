import { CommandCallData, Command, CoreData } from "./types";
import * as BotUtils from "./bot_utils";
import fs from "fs";
import path from "path";
import { Message, DMChannel } from "discord.js";

const DEAULT_NOT_PERMITTED_ERROR_MESSAGE = ({ cmdName }: CommandCallData) => `You do not have permission to use the command \`${cmdName}\`.`;

let cmds = new Set<Command>();

function createCmd(command: Command): void {
    console.log(`loaded command '${command.name}'`);

    const convertedCommand: Command = {
        ...command,
        name:        BotUtils.removeAccents(command.name.toLowerCase()),
        aliases:     command.aliases?.map(alias => BotUtils.removeAccents(alias.toLowerCase())),
    };

    cmds.add(convertedCommand);
}

function loadCmds(cmdDir: string) {
    console.log(`-- loading commands from '${path.basename(cmdDir)}'... --`);

    const withoutExt = (filename: string) => filename.slice(0, filename.length - path.extname(filename).length);

    const files = fs.readdirSync(cmdDir)
        .filter(filename => !fs.lstatSync(path.join(cmdDir, filename)).isDirectory())
        .map(withoutExt);

    files.forEach(filename => {
        const cmdPath = path.join(cmdDir, filename)
        const command: Command = require(cmdPath);
        if (command?.name == undefined) return;
        createCmd(command);
    });
}

async function setUpCmds(coreData: CoreData) {
    console.log("-- started setting up commands... --");

    for (const setupPromise of [...cmds].map(cmd => cmd.setup?.(coreData))) { await setupPromise };
    
    console.log("-- finished setting up commands --");
}

export async function createCmdsListeners(coreData: CoreData, cmdDirs: string[]) {
    cmdDirs.forEach(dir => loadCmds(dir));
    await setUpCmds(coreData);

    coreData.client.on("message", (msg: Message) => {
        const cmdCall = getCmdCallData(coreData, msg);
        if (cmdCall === undefined) return;
        const cmd = getCmd(cmdCall.cmdName, false);
        if (cmd === undefined) return;
        const failingPermission = cmd.permissions?.find(({ test }) => !test(cmdCall));

        if (failingPermission !== undefined) {
            const errorMessage = failingPermission.errorMessage?.(cmdCall) ?? DEAULT_NOT_PERMITTED_ERROR_MESSAGE(cmdCall);
            BotUtils.sendEmbed(msg, "error", errorMessage);
            return;
        }

        console.log(`called command '${cmd.name}' in '${msg.guild!.name}' by user '${BotUtils.getUserString(msg.author)}' <@${msg.author.id}>`);
        cmd.call(cmdCall);
    });

    console.log("-- all message listeners set up --");
}


export function getCmd(cmdName: string, onlyCommandsWithUsage: boolean) {
    return getCmdList(onlyCommandsWithUsage).find(cmd => cmd.name === cmdName || cmd.aliases?.includes(cmdName));
}

export function getCmdCallData(coreData: CoreData, msg: Message) {
    if (msg.channel instanceof DMChannel) return undefined;
    if (msg.author.bot) return undefined;
    const cont = BotUtils.prefixless(msg);
    if (cont === undefined) return undefined;
    const split = cont.trim().split(" ").filter(x => x !== "");
    if (split.length === 0) return undefined;
    
    const [commandName, ...args] = split;
    const cmdCall: CommandCallData = {
        coreData: coreData,
        msg: msg,
        cmdName: commandName!,
        args: args,
        argsStr: args.join(" "),
        cont: cont
    };

    return cmdCall;
}

export function getCmdList(onlyCommandsWithUsage = true) {
    return [...cmds].filter(x => !onlyCommandsWithUsage || !!x.usage);
}

export function getPermittedCmdList(cmdCall: CommandCallData, onlyListAvailable: boolean): Command[] {
    const hasPerms = (x: Command) => !x.permissions?.some(({ test }) => !test(cmdCall));
    return getCmdList().filter(x => !onlyListAvailable || hasPerms(x));
}

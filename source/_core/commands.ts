import { impl, isCommand, sendEmbed, getUserString, embedToString, prefixless, Command, CommandCallData, CoreData } from "./bot_core";
import fs from "fs";
import path from "path";
import { Message, DiscordAPIError, MessageEmbed, User, DMChannel } from "discord.js";
import { addListener } from "./listeners";
import { isMessageChannel } from "./dc_utils";
import { notOf } from "./general_utils";
import { isOnlyBotPing } from "./bot_utils";

const DEAULT_NOT_PERMITTED_ERROR_MESSAGE = ({ cmdName }: CommandCallData) => `You do not have permission to use the command \`${cmdName}\`.`;

let cmds: Command[] = [];
let defaultCmdNames: string[] = [];

export function addDefaultCommands(cmdNames: string[]) {
    cmdNames.forEach(x => defaultCmdNames.push(x));
}

export async function createCmdsListeners(coreData: CoreData, cmdDirs: string[]) {
    await Promise.allSettled(cmdDirs.map(loadCmds));
    await setupCmds(coreData);

    addListener(coreData.client, "message", async (msg: Message) => {
        if (msg.author.bot) return;
        if (!isMessageChannel(msg.channel)) return;
        if (msg.channel instanceof DMChannel) return;

        if (isOnlyBotPing(msg)) {
            let cmd: Command | undefined = undefined;
            let cmdCall: CommandCallData | undefined = undefined;
            
            for (const cmdName of defaultCmdNames) {
                const command = getCmd(cmdName, false);
                if (command === undefined) continue;
                const commandCall: CommandCallData = {
                    coreData, msg,
                    cmdName: command.name,
                    args: [],
                    argsStr: "",
                };
                if (allPermsPass(command, commandCall)) {
                    cmd = command;
                    cmdCall = commandCall;
                    break;
                }
            }

            if (cmd === undefined) return;
            executeCommand(msg, cmd, cmdCall!);
        } else {
            const cmdCall = getCmdCallData(coreData, msg);
            if (cmdCall === undefined) return;
            const cmd = getCmd(cmdCall.cmdName, false);
            if (cmd === undefined) return;

            executeCommand(msg, cmd, cmdCall);
        }
    });

    console.log("-- all message listeners set up --");
}

function allPermsPass(cmd: Command, cmdCall: CommandCallData) {
    return !cmd.permissions?.some(({ test }) => !test(cmdCall));
}

async function executeCommand(msg: Message, cmd: Command, cmdCall: CommandCallData) {
    const failingPermission = cmd.permissions?.find(({ test }) => !test(cmdCall));
    if (failingPermission !== undefined) {
        const errorMessage = failingPermission.errorMessage?.(cmdCall) ?? DEAULT_NOT_PERMITTED_ERROR_MESSAGE(cmdCall);
        sendEmbed(msg, "error", errorMessage);
        return;
    }

    const cmdRes = await cmd.call(cmdCall);
    if (cmdRes == null) return;
    console.log(`'${cmd.name}' called in '${msg.guild!.name}' by user '${getUserString(msg.author)}' <@${msg.author.id}>`);

    const embedOrString = (cmdRes instanceof Function ? cmdRes(msg) : cmdRes);
    const botMember = msg.guild!.member(msg.client.user!);
    const target = botMember?.hasPermission("SEND_MESSAGES") ? msg.channel : msg.author;
    target.send(embedOrString).catch(err => {
        if (embedOrString instanceof MessageEmbed && err instanceof DiscordAPIError && !(target instanceof User)) {
            target.send(embedToString(embedOrString));
        }
    });
}

async function setupCmds(coreData: CoreData) {
    console.log("-- started setting up commands... --");

    const setupPromises = cmds.map(({ setup }) => setup?.(coreData));
    await Promise.allSettled(setupPromises);
    
    console.log("-- finished setting up commands --");
}

async function loadCmds(cmdDir: string) {
    console.log(`-- loading commands from '${path.basename(cmdDir)}'... --`);

    const withoutExt = (filename: string) => filename.slice(0, filename.length - path.extname(filename).length);
    const filenames = fs.readdirSync(cmdDir)
    .filter(filename => !fs.lstatSync(path.join(cmdDir, filename)).isDirectory())
    .map(withoutExt);

    const importPromieses = filenames.map((filename): Promise<unknown> => {
        const cmdPath = path.join(cmdDir, filename);
        return import(cmdPath);
    });

    function hasDefault(obj: any): obj is { default: {} } {
        return typeof obj === "object" && obj != null && typeof obj.default === "object" && obj.default != null;
    }

    const _imports = await Promise.allSettled(importPromieses);
    const imported = _imports.map(x => x.status === "fulfilled" ? x.value : undefined).filter(notOf(undefined));
    const falied = _imports.map(x => x.status === "rejected" ? x.reason : undefined).filter(notOf(undefined));
    if (falied.length !== 0) console.error(falied);
    const commands = imported.map(x => hasDefault(x) ? x.default : x).filter(isCommand);
    commands.forEach(createCmd);
}

function createCmd(command: Command) {
    console.log(`command created: '${command.name}'`);
    const convertedCommand: Command = {
        ...command,
        name:        impl.applyMessageContentModifiers(command.name),
        aliases:     command.aliases?.map(alias => impl.applyMessageContentModifiers(alias)),
    };
    cmds.push(convertedCommand);
}


// "public API"

export function getCmd(cmdName: string, onlyCommandsWithUsage: boolean) {
    return getCmdList(onlyCommandsWithUsage).find(cmd => cmd.name === cmdName || cmd.aliases?.includes(cmdName));
}

export function getCmdCallData(coreData: CoreData, msg: Message) {
    if (!isMessageChannel(msg.channel)) return undefined;
    if (msg.author.bot) return undefined;
    
    const contTemp = prefixless(msg);
    if (contTemp === undefined) return undefined;
    const cont = impl.applyMessageContentModifiers(contTemp);

    const splits = cont.trim().split(/\s+/);
    if (splits.length === 0) return undefined;
    
    const [commandName, ...args] = splits;
    const cmdCall: CommandCallData = {
        coreData: coreData,
        msg: msg,
        cmdName: commandName!,
        args: args,
        argsStr: args.join(" ")
    };

    return cmdCall;
}

export function getCmdList(onlyCommandsWithUsage = true) {
    return cmds.filter(x => !onlyCommandsWithUsage || !!x.usage);
}

export function getPermittedCmdList(cmdCall: CommandCallData, onlyListAvailable: boolean): Command[] {
    const hasPerms = (x: Command) => !x.permissions?.some(({ test }) => !test(cmdCall));
    return getCmdList().filter(x => !onlyListAvailable || hasPerms(x));
}

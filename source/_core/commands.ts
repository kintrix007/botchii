import { impl, keepFulfilledResults, isCommand, sendEmbed, getUserString, embedToString, prefixless, Command, CommandCallData, CoreData } from "./bot_core";
import fs from "fs";
import path from "path";
import { Message, DMChannel, DiscordAPIError, MessageEmbed, ClientVoiceManager, User } from "discord.js";
import { addListener } from "./listeners";
import { isMessageChannel } from "./dc_utils";

const DEAULT_NOT_PERMITTED_ERROR_MESSAGE = ({ cmdName }: CommandCallData) => `You do not have permission to use the command \`${cmdName}\`.`;

let cmds = new Set<Command>();

function createCmd(command: Command) {
    console.log(`loaded command '${command.name}'`);

    const convertedCommand: Command = {
        ...command,
        name:        impl.applyMessageContentModifiers(command.name),
        aliases:     command.aliases?.map(alias => impl.applyMessageContentModifiers(alias)),
    };

    cmds.add(convertedCommand);
}

async function loadCmds(cmdDir: string) {
    console.log(`-- loading commands from '${path.basename(cmdDir)}'... --`);

    const withoutExt = (filename: string) => filename.slice(0, filename.length - path.extname(filename).length);

    const files = fs.readdirSync(cmdDir)
    .filter(filename => !fs.lstatSync(path.join(cmdDir, filename)).isDirectory())
    .map(withoutExt);

    const importPromieses = files.map((filename): Promise<unknown> => {
        const cmdPath = path.join(cmdDir, filename);
        return import(cmdPath);
    });

    const hasDefault = (obj: unknown): obj is { default: any } => typeof obj === "object" && obj != null && "default" in obj;

    const imported = await keepFulfilledResults(importPromieses);
    const commands = imported.map(x => hasDefault(x) ? x.default : undefined).filter(isCommand);
    commands.forEach(createCmd);
}

async function setupCmds(coreData: CoreData) {
    console.log("-- started setting up commands... --");

    const setupPromises = [...cmds].map(({ setup }) => setup?.(coreData));
    await Promise.allSettled(setupPromises);
    
    console.log("-- finished setting up commands --");
}

export async function createCmdsListeners(coreData: CoreData, cmdDirs: string[]) {
    await Promise.allSettled(cmdDirs.map(loadCmds));
    await setupCmds(coreData);

    addListener(coreData.client, "message", async (msg: Message) => {
        if (!isMessageChannel(msg.channel)) return;
        const cmdCall = getCmdCallData(coreData, msg);
        if (cmdCall === undefined) return;
        const cmd = getCmd(cmdCall.cmdName, false);
        if (cmd === undefined) return;
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
    });

    console.log("-- all message listeners set up --");
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
    return [...cmds].filter(x => !onlyCommandsWithUsage || !!x.usage);
}

export function getPermittedCmdList(cmdCall: CommandCallData, onlyListAvailable: boolean): Command[] {
    const hasPerms = (x: Command) => !x.permissions?.some(({ test }) => !test(cmdCall));
    return getCmdList().filter(x => !onlyListAvailable || hasPerms(x));
}

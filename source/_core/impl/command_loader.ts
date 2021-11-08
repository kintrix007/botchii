import { addListener } from "../listeners";
import { isOnlyBotPing, isCommand, impl } from "../utils/bot_utils";
import { getCmd, getCmdCallData } from "../commands";
import { isMessageChannel, sendEmbed, getUserString, embedToString } from "../utils/dc_utils";
import { notOf } from "../utils/general_utils";
import { CommandCallData, Command, CoreData, CommandPermission } from "../types";
import { Message, DMChannel, MessageEmbed, DiscordAPIError, User } from "discord.js";
import path from "path";
import fs from "fs";
import { isInsideLimit } from "./limit_utils";

const DEAULT_NOT_PERMITTED_ERROR_MESSAGE: Required<CommandPermission>["errorMessage"]
    = ({ cmdName }) => `You do not have permission to use the command \`${cmdName}\`.`;

export let cmds: Command[] = [];
export let defaultCmdNames: string[] = [];

export function addDefaultCommands(cmdNames: string[]) {
    cmdNames.forEach(x => defaultCmdNames.push(x));
}

export async function createCmdsListeners(coreData: CoreData, cmdDirs: string[]) {
    await Promise.allSettled(cmdDirs.map(loadCmds)).catch(console.error);
    await setupCmds(coreData);

    addListener(coreData.client, "message", async (msg: Message) => {
        if (msg.author.bot) return;
        if (!isMessageChannel(msg.channel)) return;
        if (msg.channel instanceof DMChannel) return;

        let cmd: Command | undefined = undefined;
        let cmdCall: CommandCallData | undefined = undefined;
        if (isOnlyBotPing(msg)) {
            
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
        } else {
            cmdCall = getCmdCallData(coreData, msg);
            if (cmdCall === undefined) return;
            cmd = getCmd(cmdCall.cmdName, false);
            
        }

        if (cmd === undefined) return;
        if (!isInsideLimit({ msg: cmdCall!.msg, cmd: cmd })) return;
        executeCommand(msg, cmd, cmdCall!);
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

    const _imports = await Promise.allSettled(importPromieses).catch(console.error);
    if (_imports == null) return;
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
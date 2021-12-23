import { impl, Command, CommandCallData, CoreData } from "./bot_core";
import { Message, } from "discord.js";
import { isMessageChannel } from "./utils/dc_utils";
import { cmds } from "./impl/command_loader"
import { getCommandLimits, isInsideLimit } from "./impl/limit_utils";


// "public API"

export function getCmd(cmdName: string, onlyCommandsWithUsage: boolean) {
    return getCmdList(onlyCommandsWithUsage).find(cmd => isCalledBy(cmd, cmdName));
}

export function getCmdCallData(coreData: CoreData, msg: Message): CommandCallData | undefined {
    if (!isMessageChannel(msg.channel)) return undefined;
    if (msg.author.bot) return undefined;
    
    const contTemp = impl.prefixless(msg);
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

export function getPermittedCmdList(cmdCall: CommandCallData): Command[] {
    const hasPerms = (x: Command) => !x.permissions?.some(({ test }) => !test(cmdCall));
    return getCmdList().filter(cmd => hasPerms(cmd) && isInsideLimit({ msg: cmdCall.msg, cmd: cmd }));
}

export function isCalledBy(cmd: Command, cmdName: string): boolean {
    return cmd.name == cmdName || (cmd.aliases?.includes(cmdName) ?? false);
}

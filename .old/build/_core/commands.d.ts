import { Command, CommandCallData, CoreData } from "./bot_core";
import { Message } from "discord.js";
export declare function getCmd(cmdName: string, onlyCommandsWithUsage: boolean): Command | undefined;
export declare function getCmdCallData(coreData: CoreData, msg: Message): CommandCallData | undefined;
export declare function getCmdList(onlyCommandsWithUsage?: boolean): Command[];
export declare function getPermittedCmdList(cmdCall: CommandCallData): Command[];
export declare function isCalledBy(cmd: Command, cmdName: string): boolean;

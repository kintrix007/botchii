import { CommandContentModifier, CoreData, CustomCoreData } from "./types";
import { ClientOptions } from "discord.js";
export * from "./types";
export * from "./utils/bot_utils";
export * from "./utils/general_utils";
export * from "./utils/dc_utils";
export * from "./utils/alias_utils";
export { getCmd, getCmdCallData, getCmdList, getPermittedCmdList } from "./commands";
export { addListener, deleteListener } from "./listeners";
interface SetupData {
    commandDirs: string[];
    defaultPrefix?: string;
    defaultCommands?: string[];
    options?: ClientOptions;
    messageContentModifiers?: CommandContentModifier[];
    onready?: (coreData: CoreData) => void;
}
export declare function initBot(customCoreData: CustomCoreData, setupData: SetupData): Promise<void>;

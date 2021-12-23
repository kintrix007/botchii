import { Command, CoreData } from "../types";
export declare let cmds: Command[];
export declare let defaultCmdNames: string[];
export declare function addDefaultCommands(cmdNames: string[]): void;
export declare function createCmdsListeners(coreData: CoreData, cmdDirs: string[]): Promise<void>;

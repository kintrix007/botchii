import { Client, Message } from "discord.js";
import * as ExtensionTypes from "../extension_types";


type BaseCommandGroup = "help" | "admin" | "owner";

interface BaseCoreData {
    client:         LoggedInClient;
    defaultPrefix:  string;
}

export type LoggedInClient = Client & {
    [K in keyof Client]: NonNullable<Client[K]>
};

export type CommandContentModifier = (cont: string) => string;

export type GuildPrefs<T extends {}> = { guildName: string } & T
export interface Prefs<T extends {}> {
    [guildID: string]: GuildPrefs<T>;
}

export type CommandPermission = {
    test:          (cmdCall: CommandCallData) => boolean;
    errorMessage?: (cmdCall: CommandCallData) => string;
    description?:  (cmd: Command) => string
};

export type CustomCoreData     = ExtensionTypes.CustomCoreData;
export type CustomCommandGroup = ExtensionTypes.CustomCommandGroup;

export type CoreData     = Readonly<BaseCoreData & CustomCoreData>;
export type CommandGroup = BaseCommandGroup | CustomCommandGroup;

export type CommandCallData = Readonly<{
    coreData:   CoreData;
    msg:        Message;
    cmdName:    string;
    args:       string[];
    argsStr:    string;
}>;

/**
 * @param setup is called once the bot starts. Ideal to set up reaction listeners, or similar.
 * @param call is called when a user uses the given command.
 * @param permissions A member has permission to use a commmand, if they have ALL needed permissions. If undefined, anyone can use it.
 * A command is called either by it's name, or any of its aliases.
 * If multiple commands have the same name, a random one is executed.
 * @param group is only used for the help sheet.
 * @param usage Only commands which have a usage show up in the help sheet.
 * @param description is only used in the help sheet. Should briefly explain how the command works.
 * @param examples are the examples shown in the examples shown in the help sheet. A string array represents one way of calling it.
 * For example the help command would have examples `[[], ["prefix"]]`, as it can be called without any arguements, or one arguement.
 */
export interface Command {
    setup?:         (coreData: CoreData) => Promise<unknown> | void;
    call:           (cmdCall: CommandCallData) => Promise<unknown> | void;
    name:           string;
    aliases?:       string[];
    
    permissions?:   CommandPermission[];
    group?:         CommandGroup;
    
    usage?:         string | string[];
    description?:   string;
    examples?:      string[][];
}

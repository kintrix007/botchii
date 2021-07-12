import { Client, DMChannel, Message, MessageEmbed, NewsChannel, TextChannel, User } from "discord.js";
import * as CustomBotTypes from "../bot_types";

type CCD = CustomBotTypes.CustomCoreData;
type CCG = CustomBotTypes.CustomCommandGroup;
export type CustomCoreData = CCD extends {} ? CCD : never;
export type CustomCommandGroup = CCG extends string ? CCG : never;

type BaseCommandGroup = "help" | "admin" | "owner";

interface BaseCoreData {
    client:         LoggedInClient;
    defaultPrefix:  string;
}

// Not sure if needed
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

export type CoreData     = Readonly<BaseCoreData & CustomCoreData>;
export type CommandGroup = BaseCommandGroup | CustomCommandGroup;

export type CommandCallData = Readonly<{
    coreData:   CoreData;
    msg:        Message;
    cmdName:    string;
    args:       string[];
    argsStr:    string;
}>;

type Target = User | Message | TextChannel | NewsChannel | DMChannel;
type AsyncOrSync<T> = T | Promise<T>;

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
    setup?:         (coreData: CoreData) => AsyncOrSync<unknown>;
    call:           (cmdCall: CommandCallData) => AsyncOrSync<
        void | string | MessageEmbed
        | ( (target: Target) => string | MessageEmbed )
    >;
    name:           string;
    aliases?:       string[];
    
    permissions?:   CommandPermission[];
    
    group?:         CommandGroup;
    usage?:         string | string[];
    description?:   string;
    examples?:      string[][];
}

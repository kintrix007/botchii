import * as CoreTools from "./core_tools";
import { Client, Message } from "discord.js";
import * as ExtensionTypes from "../extension_types";


type BaseCommandGroup = "" | "help" | "admin" | "owner";

interface BaseData {
    client:         Client;
    defaultPrefix:  string;
}

export const adminPermission: CommandPermission = {
    func: msg => CoreTools.isAdmin(msg.member),
    description: "Only people with the **admin role**, or with the **Administrator** permission can use this command.",
    errorMessage: ({ cmdName }) =>`The command \`${cmdName}\` can only be used by admins.`
};
export const ownerPermission: CommandPermission = {
    func: msg => CoreTools.isBotOwner(msg.author),
    description: "Only the bot's **owner** can use this command.",
    errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by the bot's owner.`
};


export interface Prefs<T extends {}> {
    [guildID: string]: ({
        guildName: string;
    } & T) | undefined;
}

export type PermissionFunc = (msg: Message) => boolean;

export type CommandPermission = {
    description?:  string;
    errorMessage?: (combData: CombinedData) => string
    func:          PermissionFunc;
};
export type CommandPermissions = CommandPermission[];

export interface Command {
    setupFunc?:     (data: Data) => void;
    
    func:           (combData: CombinedData) => void;
    name:           string;
    aliases?:       string[];
    
    permissions?:   CommandPermissions;
    group?:         CommandGroup;
    
    usage?:         string;
    description?:   string;
    examples?:      string[];
}

export type CustomData         = ExtensionTypes.CustomData;
export type CustomCommandGroup = ExtensionTypes.CustomCommandGroup;

export type Data               = Readonly<BaseData & CustomData>;
export type CommandGroup       = BaseCommandGroup | CustomCommandGroup;

export interface CombinedData {
    data:       Data;
    msg:        Message;
    cmdName:    string;
    args:       string[];
    argsStr:    string;
    cont:       string;
}

import * as CoreTools from "./core_tools";
import { Client, Message } from "discord.js";
import * as ExtensionTypes from "./extension_types";

/*
* -----------------------------
* vvv can NOT be modified! vvv
* -----------------------------
*/

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


export type PermissionFunc = (msg: Message) => boolean;

export type CommandPermission = {
    description?:  string;
    errorMessage?: (combData: CombinedData) => string
    func:          PermissionFunc;
};
export type CommandPermissions = CommandPermission[];

export interface Command {
    setupFunc?:     (data: Data) => Promise<any>;
    
    func:           (combData: CombinedData) => any;
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
export type Data               = BaseData & CustomData;
export type CommandGroup       = BaseCommandGroup | CustomCommandGroup;

export interface CombinedData {
    data:       Data;
    msg:        Message;
    args:       string[];
    cmdName:    string;
    argsStr:    string;
    cont:       string;
}

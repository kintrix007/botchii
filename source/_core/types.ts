import * as CoreTools from "./core_tools";
import { Client, Message, User } from "discord.js";


/*
 * -----------------------------
 * vvv can NOT be modified! vvv
 * -----------------------------
*/

export type Data         = BaseData & CustomData;
export type CommandGroup = BaseCommandGroup | CustomCommandGroup;


export interface CombinedData {
    data:       Data;
    msg:        Message;
    args:       string[];
    cmdName:    string;
    argsStr:    string;
    cont:       string;
}


type PermissionFunc = (msg: Message) => boolean;

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


export const adminPermission: CommandPermission = {
    func: msg => CoreTools.isAdmin(msg.member),
    description: "Only people with the admin role, or people with `Administrator` permission can use this coommand.",
    errorMessage: ({ cmdName }) =>`The command \`${cmdName}\` can only be used by admins.`
};
export const ownerPermission: CommandPermission = {
    func: msg => CoreTools.isBotOwner(msg.author),
    description: "Only the bot's owner can use this command.",
    errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by the bot's owner.`
};


type BaseCommandGroup = "" | "help" | "admin" | "owner";

interface BaseData {
    client:         Client;
    defaultPrefix:  string;
}


/*
 * -------------------------
 * vvv CAN be modified! vvv
 * -------------------------
*/

type CustomCommandGroup = "moderation" | "roles" | "utility";

interface CustomData {
    
};


// Bot specific

export interface CustomEmoji {
    isCustom:   boolean;
    string:     string;
    isInvalid?: boolean;
}

export interface CountedEmoji extends CustomEmoji {
    count:      number;
    users:      User[];
}

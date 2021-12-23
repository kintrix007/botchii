import { Command, CommandPermission, CoreData, Prefs } from "../types";
import { AdminData } from "../default_commands/command_prefs";
import { PermissionString, GuildMember, User, Snowflake, Message } from "discord.js";
import { Impl } from "../impl/impl";
export declare const BOT_CORE_DIR: string;
export declare const ROOT_DIR: string;
export declare const SOURCE_DIR: string;
export declare const PREFS_DIR: string;
export declare const impl: Impl;
export declare function isCommand(obj: unknown): obj is Command;
export declare const adminPermission: CommandPermission;
export declare const ownerPermission: CommandPermission;
export declare function createCommandPermission(permission: PermissionString): CommandPermission;
export declare function createChannelSpecificCmdPermission(permission: PermissionString): CommandPermission;
export declare function isAdmin(member: GuildMember | undefined | null): boolean;
export declare function isBotOwner(user: User): boolean;
export declare function getAdminRole(guildID: Snowflake): import("../types").GuildPrefs<AdminData> | undefined;
export declare const getBotOwnerID: () => string;
export declare function getBotOwner(data: CoreData): Promise<User>;
export declare function isOnlyBotPing(msg: Message): boolean;
export declare function getPrefix(guildID: Snowflake): string;
export declare function savePrefs(filename: string, saveData: Prefs<{}>, silent?: boolean): void;
/** returns {} if the given prefs file does not exist */
export declare function loadPrefs<T>(filename: string, silent?: boolean): Prefs<T>;
/**
 * Overwrites a part of the prefs file.
 * Where the keys overlap, it saves the data from `overwriteData`,
 * otherwise the data from the JSON prefs file.
 * Since the keys are always the guildID's it makes it easier to update the prefs for a single guild.
*/
export declare function updatePrefs<T>(filename: string, overwriteData: Prefs<T>, silent?: boolean): void;

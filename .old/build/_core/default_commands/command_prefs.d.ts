import { Snowflake } from "discord.js";
export interface PrefixData {
    prefix: string;
}
export interface AdminData {
    roleID: string;
}
export interface AliasData {
    aliases: {
        [alias: string]: Snowflake[];
    };
}
export interface LimitData {
    limits: {
        [command: string]: Snowflake[];
    };
}
export declare const PREFIX_PREFS_FILE = "prefix";
export declare const ADMIN_PREFS_FILE = "admin";
export declare const ALIAS_PREFS_FILE = "alias";
export declare const LIMIT_PREFS_FILE = "limit";

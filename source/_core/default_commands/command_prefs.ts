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
    }
}

export interface LimitData {
    limits: {
        [command: string]: Snowflake[];
    }
}

export const PREFIX_PREFS_FILE = "prefix";
export const ADMIN_PREFS_FILE  = "admin";
export const ALIAS_PREFS_FILE  = "alias";
export const LIMIT_PREFS_FILE  = "limit";

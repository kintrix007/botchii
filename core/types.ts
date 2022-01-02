import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandPermissionData, CacheType, Client, CommandInteraction, InteractionReplyOptions, MessageEmbed, Snowflake } from "discord.js";

export const REPLY_STATUS = {
    success: 0x00bb00,
    failure: 0xbb0000,
    neutral: 0x008888,
} as const;
export type ReplyStatus = keyof typeof REPLY_STATUS;


// Same as Parameters
// type Arguements<T extends Function> = T extends (...args: infer A) => any ? A : never;
type Optional<T> = {
    [K in keyof T]?: T[K];
}


//! Might break if Snowflake gets changed in the Discord API
export type MessageLink = `https://discord.com/channels/${number | "@me"}/${number}/${number}`;

export interface CommandCall {
    client: Client<true>;
    inter:  CommandInteraction;
}

interface GlobalCommand {
    execute(call: CommandCall): Promise<void | string | [string, boolean?] | MessageEmbed | [MessageEmbed, boolean?] | InteractionReplyOptions>;
    setup?(client: Client<true>): Promise<void>;
    type:             "global";
    slashCommand:     SlashCommandBuilder;
    permissions?:     ApplicationCommandPermissionData[];
    group?:           string;
    longDescription?: string;
    examples?: {
        usage:        string;
        explanation?: string;
    }[] | string[];
}

interface GuildCommand {
    execute(call: CommandCall): Promise<void | string | [string, boolean?] | MessageEmbed | [MessageEmbed, boolean?] | InteractionReplyOptions>;
    setup?(client: Client<true>): Promise<void>;
    type:             "guild";
    slashCommand:     SlashCommandBuilder;
    group?:           string;
    longDescription?: string;
    examples?: {
        usage:        string;
        explanation?: string;
    }[] | string[];
}

export type Command = GlobalCommand | GuildCommand;

export type GuildPreferences = Optional<{
    admin: {
        roleId: Snowflake;
    };
    aliases: {
        [alias: string]: Snowflake[];
    };
}>;

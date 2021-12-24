import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, Client, CommandInteraction, InteractionReplyOptions, MessageEmbed } from "discord.js";

// Same as Parameters
// type Arguements<T extends Function> = T extends (...args: infer A) => any ? A : never;

type InteractionReply = Parameters<CommandInteraction<CacheType>["reply"]>[0];

//! Might break if Snowflake gets changed in the Discord API
type Snowflake = number;
export type MessageLink = `https://discord.com/channels/${Snowflake | "@me"}/${Snowflake}/${Snowflake}`;

export interface CommandCall {
    client: Client<true>;
    inter:  CommandInteraction;
}

export interface Command {
    slashCommand: SlashCommandBuilder;
    setup?(client: Client<true>): Promise<void>;
    group?: string;
    longDescription?: string;
    examples?: {
        usage:        string;
        explanation?: string;
    }[] | string[];
    execute(call: CommandCall): Promise<void | string | [string, boolean?] | MessageEmbed | [MessageEmbed, boolean?] | InteractionReplyOptions>
}

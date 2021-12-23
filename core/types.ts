import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, Client, CommandInteraction } from "discord.js";

// Same as Parameters
// type Arguements<T extends Function> = T extends (...args: infer A) => any ? A : never;

type PromiseOrNot<T> = Promise<T> | T;
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
    examples?: {
        command:      string;
        explanation?: string;
    }[] | string[];
    execute(call: CommandCall): PromiseOrNot<InteractionReply | void>;
}

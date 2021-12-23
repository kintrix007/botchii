import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, Client, CommandInteraction } from "discord.js";

export interface CommandCall {
    client: Client<true>;
    inter:  CommandInteraction;
}

// Same as Parameters
// type Arguements<T extends Function> = T extends (...args: infer A) => any ? A : never;
type PromiseOrNot<T> = Promise<T> | T;

type InteractionReply = Parameters<CommandInteraction<CacheType>["reply"]>[0];

export interface Command {
    slashCommand: SlashCommandBuilder;
    execute(call: CommandCall): PromiseOrNot<InteractionReply | void>;
    setup?(): Promise<void>;
    examples?: {
        command:      string;
        explanation?: string;
    }[];
}

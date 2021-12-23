import { DMChannel, Guild, Message, NewsChannel, TextChannel } from "discord.js";
import { Command } from "../types";
export declare function createCommandLimit(guild: Guild, command: Command, channelOrChannels: TextChannel | NewsChannel | DMChannel | Array<TextChannel | NewsChannel | DMChannel>): void;
export declare function removeCommandLimit(guild: Guild, command: Command): void;
export declare function getCommandLimits(guild: Guild): {
    [command: string]: string[];
} | undefined;
export declare function isInsideLimit(cmdCall: {
    msg: Message;
    cmd: Command;
}): boolean;

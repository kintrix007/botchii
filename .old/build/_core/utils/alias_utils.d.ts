import { Guild, Snowflake, TextChannel, NewsChannel, DMChannel } from "discord.js";
export declare function parseChannels(guild: Guild, channelAliasesOrIDs: string[]): Snowflake[];
export declare function createChannelAlias(guild: Guild, alias: string, channelOrChannels: TextChannel | NewsChannel | DMChannel | Array<TextChannel | NewsChannel | DMChannel>): void;
export declare function removeChannelAlias(guild: Guild, alias: string): void;
export declare function getChannelAliases(guild: Guild): {
    [alias: string]: string[];
} | undefined;

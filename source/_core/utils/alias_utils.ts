import { Guild, Snowflake, TextChannel, NewsChannel, DMChannel } from "discord.js";
import { AliasData, ALIAS_PREFS_FILE } from "../../bot_commands/command_prefs";
import { loadPrefs, notOf, updatePrefs } from "../bot_core";

function parseChannel(guild: Guild, channelIDOrAlias: string): Snowflake[] | undefined {
    const channelRegex = /^(?:(\d+)|<#(\d+)>)$/i;
    const match = channelIDOrAlias.match(channelRegex);
    const channelID = match?.[1] ?? match?.[2]!;
    const channelIDs = (match ? [ channelID ] : getIDsFromAlias(guild, channelIDOrAlias)?.filter(notOf(undefined)));
    return channelIDs;
}

export function parseChannels(guild: Guild, channelAliasesOrIDs: string[]): Snowflake[] {
    return channelAliasesOrIDs
    .map(aliasOrID => parseChannel(guild, aliasOrID))
    .filter(notOf(undefined))
    .flat(1);
}

export function createChannelAlias(
    guild: Guild, alias: string,
    channelOrChannels: TextChannel | NewsChannel | DMChannel | Array<TextChannel | NewsChannel | DMChannel>
) {
    const channels = (channelOrChannels instanceof Array ? channelOrChannels : [channelOrChannels]);
    const aliasPrefs = loadPrefs<AliasData>(ALIAS_PREFS_FILE, true);
    
    const aliasData = aliasPrefs[guild.id];
    if (aliasData === undefined) return;
    aliasData.aliases[alias] = channels.map(x => x.id);
    
    updatePrefs(ALIAS_PREFS_FILE, { [guild.id]: aliasData });
}

export function removeChannelAlias(guild: Guild, alias: string) {
    const aliasPrefs = loadPrefs<AliasData>(ALIAS_PREFS_FILE, true);

    const aliasData = aliasPrefs[guild.id];
    if (aliasData === undefined) return;
    delete aliasData.aliases[alias];
    
    updatePrefs(ALIAS_PREFS_FILE, { [guild.id]: aliasData });
}

function getIDsFromAlias(guild: Guild, alias: string): string[] | undefined {
    const aliasData = loadPrefs<AliasData>(ALIAS_PREFS_FILE);
    return aliasData[guild.id]?.aliases?.[alias];
}

import { DMChannel, Guild, NewsChannel, TextChannel } from "discord.js";
import { LimitData, LIMIT_PREFS_FILE } from "../default_commands/command_prefs";
import { loadPrefs, updatePrefs } from "../bot_core";

export function createCommandLimit(
    guild: Guild, command: string,
    channelOrChannels: TextChannel | NewsChannel | DMChannel | Array<TextChannel | NewsChannel | DMChannel>
) {
    const channels = (channelOrChannels instanceof Array ? channelOrChannels : [channelOrChannels]);
    const limitPrefs = loadPrefs<LimitData>(LIMIT_PREFS_FILE, true);
    
    let limitData = limitPrefs[guild.id] ?? { guildName: guild.name, limits: {} };
    limitData.limits[command] = channels.map(x => x.id);
    
    updatePrefs(LIMIT_PREFS_FILE, { [guild.id]: limitData });
}

export function removeCommandLimit(guild: Guild, command: string) {
    const limitPrefs = loadPrefs<LimitData>(LIMIT_PREFS_FILE, true);

    const limitData = limitPrefs[guild.id];
    if (limitData === undefined) return;
    delete limitData.limits[command];
    
    updatePrefs(LIMIT_PREFS_FILE, { [guild.id]: limitData });
}

export function getCommandLimits(guild: Guild) {
    const limitPrefs = loadPrefs<LimitData>(LIMIT_PREFS_FILE, true);
    const limitData = limitPrefs[guild.id];
    return limitData?.limits;
}

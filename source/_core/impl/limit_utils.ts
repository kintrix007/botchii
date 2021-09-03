import { DMChannel, Guild, Message, NewsChannel, TextChannel } from "discord.js";
import { LimitData, LIMIT_PREFS_FILE } from "../default_commands/command_prefs";
import { loadPrefs, updatePrefs } from "../bot_core";
import { Command } from "../types";

export function createCommandLimit(
    guild: Guild, command: Command,
    channelOrChannels: TextChannel | NewsChannel | DMChannel | Array<TextChannel | NewsChannel | DMChannel>
) {
    const channels = (channelOrChannels instanceof Array ? channelOrChannels : [channelOrChannels]);
    const limitPrefs = loadPrefs<LimitData>(LIMIT_PREFS_FILE, true);
    
    let limitData = limitPrefs[guild.id] ?? { guildName: guild.name, limits: {} };
    limitData.limits[command.name] = channels.map(x => x.id);
    
    updatePrefs(LIMIT_PREFS_FILE, { [guild.id]: limitData });
}

export function removeCommandLimit(guild: Guild, command: Command) {
    const limitPrefs = loadPrefs<LimitData>(LIMIT_PREFS_FILE, true);

    const limitData = limitPrefs[guild.id];
    if (limitData === undefined) return;
    delete limitData.limits[command.name];
    
    updatePrefs(LIMIT_PREFS_FILE, { [guild.id]: limitData });
}

export function getCommandLimits(guild: Guild) {
    const limitPrefs = loadPrefs<LimitData>(LIMIT_PREFS_FILE, true);
    const limitData = limitPrefs[guild.id];
    return limitData?.limits;
}

export function isInsideLimit(cmdCall: { msg: Message, cmd: Command }) {
    const limits = getCommandLimits(cmdCall.msg.guild!);
    if (limits === undefined) return true;
    const limitedTo = limits[cmdCall.cmd.name];
    if (limitedTo === undefined) return true;
    return limitedTo.includes(cmdCall.msg.channel.id);
}

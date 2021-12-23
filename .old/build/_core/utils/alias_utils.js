"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannelAliases = exports.removeChannelAlias = exports.createChannelAlias = exports.parseChannels = void 0;
const bot_core_1 = require("../bot_core");
const command_prefs_1 = require("../default_commands/command_prefs");
function parseChannel(guild, channelIDOrAlias) {
    var _a, _b;
    const channelRegex = /^(?:(\d+)|<#(\d+)>)$/i;
    const match = channelIDOrAlias.match(channelRegex);
    const channelID = (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : match === null || match === void 0 ? void 0 : match[2];
    const channelIDs = (match ? [channelID] : (_b = getIDsFromAlias(guild, channelIDOrAlias)) === null || _b === void 0 ? void 0 : _b.filter(bot_core_1.notOf(undefined)));
    return channelIDs;
}
function parseChannels(guild, channelAliasesOrIDs) {
    return channelAliasesOrIDs
        .map(aliasOrID => parseChannel(guild, aliasOrID))
        .filter(bot_core_1.notOf(undefined))
        .flat(1);
}
exports.parseChannels = parseChannels;
function createChannelAlias(guild, alias, channelOrChannels) {
    var _a;
    const channels = (channelOrChannels instanceof Array ? channelOrChannels : [channelOrChannels]);
    const aliasPrefs = bot_core_1.loadPrefs(command_prefs_1.ALIAS_PREFS_FILE, true);
    let aliasData = (_a = aliasPrefs[guild.id]) !== null && _a !== void 0 ? _a : { guildName: guild.name, aliases: {} };
    aliasData.aliases[alias] = channels.map(x => x.id);
    bot_core_1.updatePrefs(command_prefs_1.ALIAS_PREFS_FILE, { [guild.id]: aliasData });
}
exports.createChannelAlias = createChannelAlias;
function removeChannelAlias(guild, alias) {
    const aliasPrefs = bot_core_1.loadPrefs(command_prefs_1.ALIAS_PREFS_FILE, true);
    const aliasData = aliasPrefs[guild.id];
    if (aliasData === undefined)
        return;
    delete aliasData.aliases[alias];
    bot_core_1.updatePrefs(command_prefs_1.ALIAS_PREFS_FILE, { [guild.id]: aliasData });
}
exports.removeChannelAlias = removeChannelAlias;
function getIDsFromAlias(guild, alias) {
    var _a, _b;
    const aliasData = bot_core_1.loadPrefs(command_prefs_1.ALIAS_PREFS_FILE);
    return (_b = (_a = aliasData[guild.id]) === null || _a === void 0 ? void 0 : _a.aliases) === null || _b === void 0 ? void 0 : _b[alias];
}
function getChannelAliases(guild) {
    const limitPrefs = bot_core_1.loadPrefs(command_prefs_1.ALIAS_PREFS_FILE, true);
    const limitData = limitPrefs[guild.id];
    return limitData === null || limitData === void 0 ? void 0 : limitData.aliases;
}
exports.getChannelAliases = getChannelAliases;

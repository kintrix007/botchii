"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInsideLimit = exports.getCommandLimits = exports.removeCommandLimit = exports.createCommandLimit = void 0;
const command_prefs_1 = require("../default_commands/command_prefs");
const bot_core_1 = require("../bot_core");
function createCommandLimit(guild, command, channelOrChannels) {
    var _a;
    const channels = (channelOrChannels instanceof Array ? channelOrChannels : [channelOrChannels]);
    const limitPrefs = bot_core_1.loadPrefs(command_prefs_1.LIMIT_PREFS_FILE, true);
    let limitData = (_a = limitPrefs[guild.id]) !== null && _a !== void 0 ? _a : { guildName: guild.name, limits: {} };
    limitData.limits[command.name] = channels.map(x => x.id);
    bot_core_1.updatePrefs(command_prefs_1.LIMIT_PREFS_FILE, { [guild.id]: limitData });
}
exports.createCommandLimit = createCommandLimit;
function removeCommandLimit(guild, command) {
    const limitPrefs = bot_core_1.loadPrefs(command_prefs_1.LIMIT_PREFS_FILE, true);
    const limitData = limitPrefs[guild.id];
    if (limitData === undefined)
        return;
    delete limitData.limits[command.name];
    bot_core_1.updatePrefs(command_prefs_1.LIMIT_PREFS_FILE, { [guild.id]: limitData });
}
exports.removeCommandLimit = removeCommandLimit;
function getCommandLimits(guild) {
    const limitPrefs = bot_core_1.loadPrefs(command_prefs_1.LIMIT_PREFS_FILE, true);
    const limitData = limitPrefs[guild.id];
    return limitData === null || limitData === void 0 ? void 0 : limitData.limits;
}
exports.getCommandLimits = getCommandLimits;
function isInsideLimit(cmdCall) {
    const limits = getCommandLimits(cmdCall.msg.guild);
    if (limits === undefined)
        return true;
    const limitedTo = limits[cmdCall.cmd.name];
    if (limitedTo === undefined)
        return true;
    return limitedTo.includes(cmdCall.msg.channel.id);
}
exports.isInsideLimit = isInsideLimit;

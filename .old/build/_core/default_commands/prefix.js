"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("../bot_core");
const command_prefs_1 = require("./command_prefs");
const description = `Sets the prefix the bot uses.
With this command you can change the bot's prefix, and also access what it is.
As an alternative, you can ping the bot instead of using the prefix.`;
exports.default = {
    call: cmdPrefix,
    name: "prefix",
    group: "admin",
    permissions: [bot_core_1.adminPermission],
    usage: "prefix [new prefix]",
    description: description,
    examples: [[], ["!!"], ["."]],
};
const MAX_PREFIX_LENGTH = 4;
function cmdPrefix({ msg, args }) {
    const newPrefix = args[0];
    if (newPrefix === undefined)
        return prefixGetter(msg);
    if (newPrefix.length > MAX_PREFIX_LENGTH) {
        return bot_core_1.createEmbed("error", `The prefix must not be longer than \`${MAX_PREFIX_LENGTH}\`! \`"${newPrefix}"\`(${newPrefix.length})`);
    }
    const prefixData = {
        [msg.guild.id]: {
            guildName: msg.guild.name,
            prefix: newPrefix
        }
    };
    bot_core_1.updatePrefs(command_prefs_1.PREFIX_PREFS_FILE, prefixData);
    const currentPrefix = bot_core_1.getPrefix(msg.guild.id);
    return bot_core_1.createEmbed("ok", {
        title: `Prefix set to \`${currentPrefix}\``,
        desc: `Successfully changed the prefix.\nFor help type: \`${currentPrefix}help\``
    });
}
function prefixGetter(msg) {
    const currentPrefix = bot_core_1.getPrefix(msg.guild.id);
    return bot_core_1.createEmbed("neutral", `The current prefix is: \`${currentPrefix}\``);
}

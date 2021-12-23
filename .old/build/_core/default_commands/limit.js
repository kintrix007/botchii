"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("../bot_core");
const limit_utils_1 = require("../impl/limit_utils");
const commands_1 = require("../commands");
const description = `Limits the usage of a command to given channels.
If the command is used outside of permitted channels, the bot will not react at all.`;
exports.default = {
    call: cmdLimit,
    name: "limitCommand",
    permissions: [bot_core_1.adminPermission],
    group: "admin",
    aliases: ["limit", "limits"],
    usage: "limitCommand [<command> <channels...>]",
    description: description,
    examples: [[], ["help", "#bots", "123456789012345678"]],
};
function cmdLimit({ msg, args }) {
    return __awaiter(this, void 0, void 0, function* () {
        const guild = msg.guild;
        const [commandStr, ...channelIDsOrAliases] = args;
        if (commandStr === undefined) {
            return sendLimits(guild);
        }
        const command = commands_1.getCmd(commandStr, false);
        if (command === undefined) {
            return bot_core_1.createEmbed("error", `Command \`${commandStr}\` does not exist.`);
        }
        if (channelIDsOrAliases.length === 0) {
            limit_utils_1.removeCommandLimit(guild, command);
            return bot_core_1.createEmbed("ok", `Successfully removed limit from command \`${command.name}\`!`);
        }
        const channelIDs = Array.from(new Set(bot_core_1.parseChannels(msg.guild, channelIDsOrAliases)));
        const channels = yield bot_core_1.fetchTextChannels(msg.client, channelIDs);
        if (channels.length === 0) {
            bot_core_1.sendEmbed(msg, "error", "No valid channels given.");
            return;
        }
        limit_utils_1.createCommandLimit(guild, command, channels);
        return bot_core_1.createEmbed("ok", `Successfully limited command \`${command.name}\` to be only used in: ${channels.map(x => "<#" + x.id + ">").join(", ")}`);
    });
}
function sendLimits(guild) {
    const limits = limit_utils_1.getCommandLimits(guild);
    if (limits === undefined || Object.values(limits).length === 0) {
        return bot_core_1.createEmbed("neutral", "No command limits set...");
    }
    const limitsStr = Object.entries(limits)
        .map(([command, channelIDs]) => `\`${command}\` limited to ${channelIDs.map(x => "<#" + x + ">").join(", ")}`)
        .join("\n");
    return bot_core_1.createEmbed("neutral", {
        title: `Command limits:`,
        desc: limitsStr
    });
}

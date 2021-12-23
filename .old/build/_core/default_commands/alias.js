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
const description = `Allows you to create aliases to channels.
An alias can refer to one or more channels. e.g. \`fun\` could refer to \`#general\` and \`#memes\`.
It can also refer to chategories by their ID's, which is identical to listing all the channels under it.`;
exports.default = {
    call: cmdAlias,
    name: "channelAlias",
    permissions: [bot_core_1.adminPermission],
    group: "announcement",
    aliases: ["alias", "aliases"],
    usage: "channelAlias [<name> <channels...>]",
    description: description,
    examples: [[], ["alias"], ["alias", "general", "123456789012345678"], ["from", "#announcements"], ["to", "general", "#memes"]],
};
function cmdAlias({ msg, args }) {
    return __awaiter(this, void 0, void 0, function* () {
        const guild = msg.guild;
        const [alias, ...channelIDsOrAliases] = args;
        if (alias === undefined) {
            return sendAliases(guild);
        }
        if (channelIDsOrAliases.length === 0) {
            bot_core_1.removeChannelAlias(guild, alias);
            return bot_core_1.createEmbed("ok", `Successfully removed channel alias \`${alias}\`.`);
        }
        // removing duplicates by converting to set
        const channelIDs = Array.from(new Set(bot_core_1.parseChannels(guild, channelIDsOrAliases)));
        const channels = yield bot_core_1.fetchTextChannels(msg.client, channelIDs);
        if (channels.length === 0) {
            return bot_core_1.createEmbed("error", "No valid channels given.");
        }
        bot_core_1.createChannelAlias(guild, alias, channels);
        return bot_core_1.createEmbed("ok", `Successfully added channel alias \`${alias}\` for ${channels.join(", ")}`);
    });
}
function sendAliases(guild) {
    const aliases = bot_core_1.getChannelAliases(guild);
    if (aliases === undefined || Object.values(aliases).length === 0) {
        return bot_core_1.createEmbed("neutral", "No aliases set...");
    }
    const aliasesStr = Object.entries(aliases)
        .map(([alias, channelIDs]) => `\`${alias}\` -> ${channelIDs.map(x => "<#" + x + ">").join(", ")}`)
        .join("\n");
    return bot_core_1.createEmbed("neutral", {
        title: `Channel aliases:`,
        desc: aliasesStr
    });
}

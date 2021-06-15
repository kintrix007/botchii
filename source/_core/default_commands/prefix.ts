import * as BotUtils from "../bot_utils";
import { Command, CommandCallData, CoreData, Prefs } from "../types";
import { PREFIX_PREFS_FILE, PrefixData } from "./command_prefs"
import { Message } from "discord.js";

const description = `Sets the prefix the bot uses.
With this command you can change the bot's prefix, and also access what it is.
As an alternative, you can ping the bot instead of using the prefix.`;

const cmd: Command = {
    call: cmdPrefix,
    name: "prefix",
    group: "admin",
    permissions: [ BotUtils.adminPermission ],
    usage: "prefix [new prefix]",
    description: description,
    examples: [ [], ["!!"], ["."] ],
};

const MAX_PREFIX_LENGTH = 4;

function cmdPrefix({ coreData, msg, args }: CommandCallData) {
    const newPrefix = args[0];

    if (newPrefix === undefined) {
        sendPrefix(coreData, msg);
        return;
    }

    if (newPrefix.length > MAX_PREFIX_LENGTH) {
        BotUtils.sendEmbed(msg, "error", `The prefix must not be longer than \`${MAX_PREFIX_LENGTH}\`! \`"${newPrefix}"\`(${newPrefix.length})`);
        return;
    }

    const prefixData: Prefs<PrefixData> = {
        [msg.guild!.id]: {
            guildName: msg.guild!.name,
            prefix:    newPrefix
        }
    };
    BotUtils.updatePrefs<PrefixData>(PREFIX_PREFS_FILE, prefixData);

    const currentPrefix = BotUtils.getPrefix(msg.guild!.id);
    BotUtils.sendEmbed(msg, "ok", {
        title: `Prefix set to \`${currentPrefix}\``,
        desc:  `Successfully changed the prefix.\nFor help type: \`${currentPrefix}help\``
    });
}

function sendPrefix(coreData: CoreData, msg: Message) {
    const currentPrefix = BotUtils.getPrefix(msg.guild!.id);
    BotUtils.sendEmbed(msg, "neutral", `The current prefix is: \`${currentPrefix}\``);
}

module.exports = cmd;

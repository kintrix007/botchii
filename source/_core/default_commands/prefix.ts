import { adminPermission, sendEmbed, updatePrefs, getPrefix, Command, CommandCallData, Prefs, createEmbed } from "../bot_core";
import { PREFIX_PREFS_FILE, PrefixData } from "./command_prefs"
import { Message } from "discord.js";

const description = `Sets the prefix the bot uses.
With this command you can change the bot's prefix, and also access what it is.
As an alternative, you can ping the bot instead of using the prefix.`;

export default <Command>{
    call: cmdPrefix,
    name: "prefix",
    group: "admin",
    permissions: [ adminPermission ],
    usage: "prefix [new prefix]",
    description: description,
    examples: [ [], ["!!"], ["."] ],
};

const MAX_PREFIX_LENGTH = 4;

function cmdPrefix({ msg, args }: CommandCallData) {
    const newPrefix = args[0];

    if (newPrefix === undefined) return prefixGetter(msg);

    if (newPrefix.length > MAX_PREFIX_LENGTH) {
        return createEmbed("error", `The prefix must not be longer than \`${MAX_PREFIX_LENGTH}\`! \`"${newPrefix}"\`(${newPrefix.length})`);
    }

    const prefixData: Prefs<PrefixData> = {
        [msg.guild!.id]: {
            guildName: msg.guild!.name,
            prefix:    newPrefix
        }
    };
    updatePrefs<PrefixData>(PREFIX_PREFS_FILE, prefixData);

    const currentPrefix = getPrefix(msg.guild!.id);
    return createEmbed("ok", {
        title: `Prefix set to \`${currentPrefix}\``,
        desc:  `Successfully changed the prefix.\nFor help type: \`${currentPrefix}help\``
    });
}

function prefixGetter(msg: Message) {
    const currentPrefix = getPrefix(msg.guild!.id);
    return createEmbed("neutral", `The current prefix is: \`${currentPrefix}\``);
}

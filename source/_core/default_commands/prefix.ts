import * as CoreTools from "../core_tools";
import * as types from "../types";
import { getHelpCmd } from "../commands";
import { PREFIX_PREFS_FILE, PrefixData } from "./command_prefs"

const description = "Sets the prefix the bot uses.\n"
    + "The default prefix is \`{}\`, but this can be changed with this command.\n"
    + "As an alternative you can ping the bot to use the commands";

const cmd: types.Command = {
    setupFunc: async data => cmd.description = description.replace(/\{\}/, data.defaultPrefix),
    func: cmdPrefix,
    name: "prefix",
    group: "admin",
    permissions: [ types.adminPermission ],
    usage: "prefix [new prefix]",
    description: description,
    examples: [ "", "!!", "." ],
};

const MAX_PREFIX_LENGTH = 4;

function cmdPrefix({ data, msg, args }: types.CombinedData) {
    const newPrefix = args[0];

    if (!newPrefix) {
        const currentPrefix = CoreTools.getPrefix(data, msg.guild!.id);
        const embed = CoreTools.sendEmbed(msg, "neutral", `The current prefix is: \`${currentPrefix ?? data.defaultPrefix}\``);
        return;
    }

    if (newPrefix.length > MAX_PREFIX_LENGTH) {
        CoreTools.sendEmbed(msg, "error", `The prefix must not be longer than \`${MAX_PREFIX_LENGTH}\`! \`"${newPrefix}"\`(${newPrefix.length})`);
        return;
    }

    const prefixData: types.Prefs<PrefixData> = {
        [msg.guild!.id]: {
            guildName: msg.guild!.name,
            prefix:    newPrefix
        }
    };
    CoreTools.updatePrefs<PrefixData>(PREFIX_PREFS_FILE, prefixData);

    const currentPrefix = CoreTools.getPrefix(data, msg.guild!.id);
    const helpCmdName = getHelpCmd()?.name;

    CoreTools.sendEmbed(msg, "ok", {
        title: `Prefix set to \`${currentPrefix}\``,
        desc:  "Successfully changed the prefix." + (helpCmdName ? `\nFor help type: \`${currentPrefix}${helpCmdName}\`` : "")
    });
    console.log(`${msg.author.username}#${msg.author.discriminator} changed the prefix to ${currentPrefix}`);
}

module.exports = cmd;

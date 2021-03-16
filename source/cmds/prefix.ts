import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { MessageEmbed } from "discord.js";
import { getHelpCmd } from "../commands"

const description = "Sets the prefix the bot uses.\n"
    + "The default prefix is \`{}\`, but this can be changed with this command.\n"
    + "As an alternative you can ping the bot to use the commands";

const cmd: types.Command = {
    setupFunc: async data => cmd.description = description.replace(/\{\}/, data.defaultPrefix),
    func: cmdPrefix,
    group: "admin",
    name: "prefix",
    adminCommand: true,
    usage: "prefix [new prefix]",
    examples: [ "", "!!", "." ],
};

const PREFS_FILE = "prefixes.json";
const MAX_PREFIX_LENGTH = 4;

export interface PrefixData {
    [guildID: string]: string;
}

function cmdPrefix({ data, msg, args }: types.CombinedData) {
    const newPrefix = args[0];

    if (!newPrefix) {
        const currentPrefix = Utilz.getPrefix(data, msg.guild!);
        const embed = new MessageEmbed()
            .setColor(0x00bb00)
            .setDescription(`The current prefix is: \`${currentPrefix ?? data.defaultPrefix}\``);
        msg.channel.send(embed);
        return;
    }

    if (newPrefix.length > MAX_PREFIX_LENGTH) {
        const embed = new MessageEmbed()
            .setColor(0xbb0000)
            .setDescription(`The prefix must not be longer than \`${MAX_PREFIX_LENGTH}\`! \`"${newPrefix}"(${newPrefix.length})\``);
        msg.channel.send(embed);
        return;
    }

    const prefixes: PrefixData = Utilz.loadPrefs(PREFS_FILE);
    prefixes[msg.guild!.id] = newPrefix;
    Utilz.savePrefs(PREFS_FILE, prefixes);

    const currentPrefix = Utilz.getPrefix(data, msg.guild!);
    const helpCmdName = getHelpCmd()?.name;

    const embed = new MessageEmbed()
        .setColor(0x00bb00)
        .setTitle(`Prefix set to \`${currentPrefix}\``)
        .setDescription("Successfully changed the prefix." + (helpCmdName ? `\nFor help type: \`${currentPrefix}${helpCmdName}\`` : ""));
    msg.channel.send(embed);
    console.log(`${msg.author.username}#${msg.author.discriminator} changed the prefix to ${currentPrefix}`);
}

module.exports = cmd;

import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { MessageEmbed } from "discord.js";

const description = "Sets the role the bot looks for to decide whether someone is an admin.\n"
+ "The default is looking for the permission `Administrator`.\n"
+ "If called without arguements, displays the current one selected.";

const cmd: types.Command = {
    setupFunc: async data => cmd.description = description.replace(/\{\}/, data.defaultPrefix),
    func: cmdMod,
    name: "admin",
    group: "admin",
    adminCommand: true,
    usage: "admin [új admin *role*]",
    examples: [ "", "@Mod" ],
    aliases: [ "administrator", "mod", "moderator" ]
};

const PREFS_FILE = "admin_roles.json";

export interface ModData {
    [guildID: string]: {
        readableGuildName: string;
        roleID:            string;
    };
}

function cmdMod({ msg, args }: types.CombinedData) {
    const newModRole = args[0];

    if (!newModRole) {
        const modRole = Utilz.getAdminRole(msg.guild!.id);
        const embed = new MessageEmbed()
            .setColor(0x00bb00)
            .setDescription(`People count as admins if they have the role <@&${modRole?.roleID}>.`);
        msg.channel.send(embed);
        return;
    }

    const regex = /^<@&(\d+)>$/i;
    const match = newModRole.match(regex);

    if (!match) {
        return;
    }

    const newModRoleID = match[1];

    const modRoles: ModData = Utilz.loadPrefs(PREFS_FILE);
    modRoles[msg.guild!.id] = {
        readableGuildName: msg.guild!.id,
        roleID: newModRoleID
    };
    Utilz.savePrefs(PREFS_FILE, modRoles);

    const embed = new MessageEmbed()
        .setColor(0x00bb00)
        .setTitle("Changed the tracked admin role!")
        .setDescription(`From now on, people with the <@&${newModRoleID}> role count as admins.`);
    msg.channel.send(embed);
    console.log(`${msg.author.username}#${msg.author.discriminator} changed the prefix to ${newModRoleID}`);
}

module.exports = cmd;

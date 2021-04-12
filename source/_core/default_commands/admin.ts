import * as CoreTools from "../core_tools";
import * as types from "../types";
import { MessageEmbed } from "discord.js";

const description = "Sets the role the bot looks for to decide whether someone is an admin.\n"
+ "The default behavior is looking for the permission `Administrator`.\n"
+ "If called without arguements, displays the currently selected criteria.";

const cmd: types.Command = {
    func: cmdMod,
    name: "admin",
    permissions: [ types.adminPermission ],
    group: "admin",
    usage: "admin [new admin role]",
    description: description,
    examples: [ "", "@Mod" ],
    aliases: [ "administrator", "mod", "moderator" ]
};

export const ADMIN_PREFS_FILE = "admin_roles.json";
export interface AdminData {
    [guildID: string]: {
        readableGuildName: string;
        roleID:            string;
    };
}

async function cmdMod({ msg, args }: types.CombinedData) {
    const newModRole = args[0];

    if (!newModRole) {
        const adminRoleID = CoreTools.getAdminRole(msg.guild!.id)?.roleID;
        
        const reply = "People count as admins if they have the "
            + (adminRoleID ? `role <@&${adminRoleID}>` : "`Administrator` permission") + ".";
            
        const embed = new MessageEmbed()
            .setColor(0x00bb00)
            .setDescription(reply);
        msg.channel.send(embed);
        console.log(`${msg.author.username}#${msg.author.discriminator} has queried the admin role.`);
        return;
    }

    const regex = /^<@&(\d+)>$/i;
    const match = newModRole.match(regex);

    const newAdminRoleID = match?.[1];

    if (!(match && await msg.guild!.roles.fetch(newAdminRoleID))) {
        const embed = new MessageEmbed()
            .setColor(0xbb0000)
            .setDescription("No valid roles given!");
        msg.channel.send(embed);
        return;
    }

    const modRoles: AdminData = CoreTools.loadPrefs(ADMIN_PREFS_FILE);
    modRoles[msg.guild!.id] = {
        readableGuildName: msg.guild!.id,
        roleID: newAdminRoleID!
    };
    CoreTools.savePrefs(ADMIN_PREFS_FILE, modRoles);

    const embed = new MessageEmbed()
        .setColor(0x00bb00)
        .setTitle("Changed the tracked admin role!")
        .setDescription(`From now on, people with the <@&${newAdminRoleID!}> role count as admins.`);
    msg.channel.send(embed);
    console.log(`${msg.author.username}#${msg.author.discriminator} changed the admin role to '${newAdminRoleID!}'`);
}

module.exports = cmd;

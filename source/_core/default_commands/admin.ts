import * as CoreTools from "../core_tools";
import * as types from "../types";

const description = "Sets the role the bot looks for to decide whether someone is an admin.\n"
+ "The default behavior is looking for the permission **Administrator**.\n"
+ "If called without arguements, displays the currently selected criteria.";

const cmd: types.Command = {
    func: cmdMod,
    name: "admin",
    permissions: [{
        func: msg => msg.member?.hasPermission("ADMINISTRATOR") ?? false,
        description: "Only people with the **Administrator** permission can use this command.",
        errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by people with **Administrator** permission.`
    }],
    group: "admin",
    usage: "admin [new admin role]",
    description: description,
    examples: [ "", "@Mod" ],
    aliases: [ "administrator", "mod", "moderator" ]
};

const { ADMIN_PREFS_FILE } = CoreTools;
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
            + (adminRoleID ? `role <@&${adminRoleID}>` : "**Administrator** permission") + ".";
            
        CoreTools.sendEmbed(msg, "ok", reply);
        console.log(`${msg.author.username}#${msg.author.discriminator} has queried the admin role.`);
        return;
    }

    const regex = /^(?:<@&(\d+)>|(\d+))$/i;
    const match = newModRole.match(regex);

    if (!match) {
        CoreTools.sendEmbed(msg, "error", "The given role is invalid!");
        return;
    }
    
    const newAdminRoleID = match[1] ?? match[2];

    try {
        await msg.guild!.roles.fetch(newAdminRoleID);
    } catch (err) {
        CoreTools.sendEmbed(msg, "error", "The given role is invalid!");
        return;
    }

    const modRoles: AdminData = CoreTools.loadPrefs(ADMIN_PREFS_FILE);
    modRoles[msg.guild!.id] = {
        readableGuildName: msg.guild!.id,
        roleID: newAdminRoleID!
    };
    CoreTools.savePrefs(ADMIN_PREFS_FILE, modRoles);

    CoreTools.sendEmbed(msg, "ok", {
        title: "Successfully changed the tracked admin role!",
        desc:  `From now on, people with the <@&${newAdminRoleID!}> role count as admins.`
    });
    console.log(`${msg.author.username}#${msg.author.discriminator} changed the admin role to '${newAdminRoleID!}'`);
}

module.exports = cmd;

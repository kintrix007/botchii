import * as CoreTools from "../core_tools";
import * as types from "../types";
import { ADMIN_PREFS_FILE, AdminData } from "./command_prefs"

const description = "Sets the role the bot looks for to decide whether someone is an admin.\n"
+ "The default behavior is looking for the **Administrator** permission.\n"
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
    examples: [ "", "@Admin" ],
    aliases: [ "administrator", "mod", "moderator" ]
};

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

    const adminData: types.Prefs<AdminData> = {
        [msg.guild!.id]: {
            guildName: msg.guild!.name,
            roleID:    newAdminRoleID
        }
    }
    CoreTools.updatePrefs(ADMIN_PREFS_FILE, adminData);

    CoreTools.sendEmbed(msg, "ok", {
        title: "Successfully changed the tracked admin role!",
        desc:  `From now on, people with the <@&${newAdminRoleID!}> role count as admins.`
    });
    console.log(`${msg.author.username}#${msg.author.discriminator} changed the admin role to '${newAdminRoleID!}'`);
}

module.exports = cmd;

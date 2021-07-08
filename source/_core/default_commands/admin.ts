import { createEmbed } from "_core/dc_utils";
import { Command, CommandCallData, createCommandPermission, getAdminRole, Prefs, updatePrefs } from "../bot_core";
import { ADMIN_PREFS_FILE, AdminData } from "./command_prefs";

const description = "Sets the role the bot looks for to decide whether someone is an admin.\n"
+ "The default behavior is looking for the **Administrator** permission.\n"
+ "If called without arguements, displays the currently selected criteria.";

export default {
    call: cmdAdmin,
    name: "admin",
    permissions: [ createCommandPermission("ADMINISTRATOR") ],
    group: "admin",
    usage: "admin [new admin role]",
    description: description,
    examples: [ [], ["@Admin"] ],
    aliases: [ "administrator", "mod", "moderator" ]
} as Command;

async function cmdAdmin({ msg, args }: CommandCallData) {
    const newModRole = args[0];

    if (newModRole === undefined) {
        const adminRoleID = getAdminRole(msg.guild!.id)?.roleID;
        
        const reply = "People count as admins if they have the "
            + (adminRoleID ? `role <@&${adminRoleID}>` : "**Administrator** permission") + ".";
            
        return createEmbed("ok", reply);
    }

    const regex = /^(?:<@&(\d+)>|(\d+))$/i;
    const match = newModRole.match(regex);

    if (!match) return createEmbed("error", "The given role is invalid!");
    
    const newAdminRoleID = (match[1] ?? match[2])!;

    try {
        await msg.guild!.roles.fetch(newAdminRoleID);
    } catch (err) {
        return createEmbed("error", "The given role is invalid!");
    }

    const adminData: Prefs<AdminData> = {
        [msg.guild!.id]: {
            guildName: msg.guild!.name,
            roleID:    newAdminRoleID
        }
    }
    updatePrefs(ADMIN_PREFS_FILE, adminData);

    return createEmbed("ok", {
        title: "Successfully changed the tracked admin role!",
        desc:  `From now on, people with the <@&${newAdminRoleID!}> role count as admins.`
    });
}

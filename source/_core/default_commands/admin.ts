import * as BotUtils from "../bot_utils";
import { Command, CommandCallData, Prefs } from "../types";
import { ADMIN_PREFS_FILE, AdminData } from "./command_prefs"

const description = "Sets the role the bot looks for to decide whether someone is an admin.\n"
+ "The default behavior is looking for the **Administrator** permission.\n"
+ "If called without arguements, displays the currently selected criteria.";

const cmd: Command = {
    call: cmdAdmin,
    name: "admin",
    permissions: [ BotUtils.createCommandPermission("ADMINISTRATOR") ],
    group: "admin",
    usage: "admin [new admin role]",
    description: description,
    examples: [ [], ["@Admin"] ],
    aliases: [ "administrator", "mod", "moderator" ]
};

async function cmdAdmin({ msg, args }: CommandCallData) {
    const newModRole = args[0];

    if (newModRole === undefined) {
        const adminRoleID = BotUtils.getAdminRole(msg.guild!.id)?.roleID;
        
        const reply = "People count as admins if they have the "
            + (adminRoleID ? `role <@&${adminRoleID}>` : "**Administrator** permission") + ".";
            
        BotUtils.sendEmbed(msg, "ok", reply);
        return;
    }

    const regex = /^(?:<@&(\d+)>|(\d+))$/i;
    const match = newModRole.match(regex);

    if (!match) {
        BotUtils.sendEmbed(msg, "error", "The given role is invalid!");
        return;
    }
    
    const newAdminRoleID = (match[1] ?? match[2])!;

    try {
        await msg.guild!.roles.fetch(newAdminRoleID);
    } catch (err) {
        BotUtils.sendEmbed(msg, "error", "The given role is invalid!");
        return;
    }

    const adminData: Prefs<AdminData> = {
        [msg.guild!.id]: {
            guildName: msg.guild!.name,
            roleID:    newAdminRoleID
        }
    }
    BotUtils.updatePrefs(ADMIN_PREFS_FILE, adminData);

    BotUtils.sendEmbed(msg, "ok", {
        title: "Successfully changed the tracked admin role!",
        desc:  `From now on, people with the <@&${newAdminRoleID!}> role count as admins.`
    });
}

module.exports = cmd;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("../bot_core");
const command_prefs_1 = require("./command_prefs");
const description = "Sets the role the bot looks for to decide whether someone is an admin.\n"
    + "The default behavior is looking for the **Administrator** permission.\n"
    + "If called without arguements, displays the currently selected criteria.";
exports.default = {
    call: cmdAdmin,
    name: "admin",
    permissions: [bot_core_1.createCommandPermission("ADMINISTRATOR")],
    group: "admin",
    usage: "admin [new admin role]",
    description: description,
    examples: [[], ["@Admin"]],
    aliases: ["administrator", "mod", "moderator"]
};
function cmdAdmin({ msg, args }) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const newModRole = args[0];
        if (newModRole === undefined) {
            const adminRoleID = (_a = bot_core_1.getAdminRole(msg.guild.id)) === null || _a === void 0 ? void 0 : _a.roleID;
            const reply = "People count as admins if they have the "
                + (adminRoleID ? `role <@&${adminRoleID}>` : "**Administrator** permission") + ".";
            return bot_core_1.createEmbed("ok", reply);
        }
        const regex = /^(?:<@&(\d+)>|(\d+))$/i;
        const match = newModRole.match(regex);
        if (!match)
            return bot_core_1.createEmbed("error", "The given role is invalid!");
        const newAdminRoleID = ((_b = match[1]) !== null && _b !== void 0 ? _b : match[2]);
        try {
            yield msg.guild.roles.fetch(newAdminRoleID);
        }
        catch (err) {
            return bot_core_1.createEmbed("error", "The given role is invalid!");
        }
        const adminData = {
            [msg.guild.id]: {
                guildName: msg.guild.name,
                roleID: newAdminRoleID
            }
        };
        bot_core_1.updatePrefs(command_prefs_1.ADMIN_PREFS_FILE, adminData);
        return bot_core_1.createEmbed("ok", {
            title: "Successfully changed the tracked admin role!",
            desc: `From now on, people with the <@&${newAdminRoleID}> role count as admins.`
        });
    });
}

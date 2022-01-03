import { roleMention, SlashCommandBuilder } from "@discordjs/builders";
import { APIRole } from "discord-api-types";
import { Guild, Role } from "discord.js";
import { prefs, tuple } from "../core/core";
import { Command } from "../core/types";

const _command: Command = {
    type: "guild",
    slashCommand: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Set or query the admin role")
        .setDefaultPermission(false),
    setup: async client => {
        _command.slashCommand.addRoleOption(option =>
            option.setName("role")
            .setDescription("Set this as the new admin role")
        );
    },
    examples: [ "", "@Admin" ],
    execute: async ({ inter }) => {
        const targetRole = inter.options.getRole("role");
        if (targetRole === null) return getRole(inter.guild!);
        else                     return setRole(inter.guild!, targetRole);
    },
};

export default _command;

function getRole(guild: Guild) {
    const admin = prefs(guild.id, "admin");
    const roleId = admin.get()?.roleId;
    return tuple(roleId !== undefined
        ? `The current admin role is ${roleMention(roleId)}.`
        : "The admin role is unset.",
        true);
}
    
function setRole(guild: Guild, targetRole: Role | APIRole) {
    const admin = prefs(guild.id, "admin");
    const roleId = targetRole.id;
    admin.set({ roleId });
    return tuple(`Successfully set the admin role as ${roleMention(roleId)}.`, true);
}

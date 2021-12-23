import { SlashCommandBuilder } from "@discordjs/builders";
import { CacheType, CommandInteraction } from "discord.js";
import { Command } from "../core/types";

export default <Command>{
    slashCommand: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows the help sheet.")
        .addStringOption(option =>
            option.setName("command")
                .setDescription("Show the help sheet of this command")
                .addChoice("Help", "help")
        ),
    execute: ({ inter }) => {
        // inter.reply("Hello");
        return { content: "Hello", ephemeral: true }
    },
};

import { SlashCommandBuilder } from "@discordjs/builders";
import { getCommandNames } from "../core/commandLoader";
import { Command } from "../core/types";

const command: Command = {
    slashCommand: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows the help sheet."),
    execute: ({ inter }) => {
        return { content: "Hello", ephemeral: true }
    },
    setup: async client => {
        command.slashCommand.addStringOption(option =>
            option.setName("command")
                .setDescription("Show the help sheet of this command")
                .addChoices(getCommandNames().map(x => [x, x]))
        );
    },
};

export default command;

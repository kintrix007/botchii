import { SlashCommandBuilder } from "@discordjs/builders";
import { getCommandNames } from "../core/commandLoader";
import { Command } from "../core/types";

const command: Command = {
    slashCommand: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows the help sheet."),
    setup: async client => {
        command.slashCommand.addStringOption(option =>
            option.setName("command")
                .setDescription("Show the help sheet of this command")
                .addChoices(getCommandNames().map(x => [x, x]))
        );
    },
    examples: [ "", "help" ],
    execute: ({ inter }) => {
        const commandName = inter.options.getString("command");
        if (commandName === null) general();
        else                      specific(commandName);
    },
};

export default command;

function general() {
    //TODO implement
}

function specific(commandName: string) {
    //TODO implement
}

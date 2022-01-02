import { SlashCommandBuilder } from "@discordjs/builders";
import { getCommand, getCommandNames } from "../core/commandLoader";
import { createEmbed, OwnerPermission, tuple } from "../core/core";
import { Command } from "../core/types";

const _command: Command = {
    type: "global",
    slashCommand: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows the help sheet"),
    setup: async client => {
        _command.slashCommand.addStringOption(option =>
            option.setName("command")
                .setDescription("Show the help sheet of this command")
                .addChoices(getCommandNames().map(x => tuple(x, x)))
        );
    },
    // Demonstration for how permissions work
    // permissions: [
    //     OwnerPermission(true),
    // ],
    examples: [ "", "help" ],
    execute: async ({ inter }) => {
        const commandName = inter.options.getString("command");
        if (commandName === null) return general();
        else                      return specific(commandName);
    },
};

export default _command;

function general() {
    const commandNames = getCommandNames();
    const commands = commandNames.map(name => getCommand(name));
    const table = commands.map(({ slashCommand: { name, description } }) => [ "`/" + name + "`", description ] as const);
    const result = table.map(x => x.join(" - ")).reduce((acc, x) => acc + "\n" + x);
    return tuple(createEmbed("neutral", result), true);
}

function specific(commandName: string) {
    const command = getCommand(commandName);
    const name = command.slashCommand.name;
    const desc = command.slashCommand.description;
    const longDesc = command.longDescription;
    const examples = command.examples?.map(x => {
        if (typeof x === "string") return "`" + (x == "" ? `/${name}` : `/${name} ${x}`) + "`";
        else {
            const { usage, explanation } = x;
            return "`" + (usage == "" ? `/${name}` : `/${name} ${usage}`) + "`" + (explanation !== undefined ? ` - ${explanation}` : "");
        }
    })?.join("\n");
    let result = desc;
    if (longDesc) result += `\n\nDescription:\n${longDesc}`;
    if (examples) result += `\n\nExamples:\n${examples}`;
    return tuple(createEmbed("neutral", { title: `\`/${name}\``, desc: result }), true);
}

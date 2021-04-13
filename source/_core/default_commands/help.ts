import * as CoreTools from "../core_tools";
import * as types from "../types";
import { getCmdList } from "../commands";

const cmd: types.Command = {
    func: cmdHelp,
    name: "help",
    group: "help",
    usage: "help [command name]",
    description: "Gives you a list of commands, or it can give further information about a specific command.",
    examples: [ "", "prefix" ]
};

const footerNote = "[] means optional arguements\n<> means obligatory arguements.";

function cmdHelp(combData: types.CombinedData) {
    const targetCommand = combData.args[0];

    if (targetCommand) {
        querySpecificHelpSheet(combData, targetCommand);
    } else {
        queryGeneralHelpSheet(combData);
    }
}

function queryGeneralHelpSheet({ data, msg }: types.CombinedData) {
    const currentPrefix = CoreTools.getPrefix(data, msg.guild!.id);

    const cmdList = getCmdList(msg);
        const commandsInGroups: {[K in types.CommandGroup]?: types.Command[]} = {};
        cmdList.forEach(command => {
            const group = command.group ?? ""; // "" means ungrouped
            if (commandsInGroups[group] === undefined) {
                commandsInGroups[group] = [];
            }
            commandsInGroups[group]!.push(command);
        });

        const commandsAssocList = (Object.entries(commandsInGroups)
            .filter(([,commands]) => commands != undefined) as [types.CommandGroup, types.Command[]][])
            .sort()
            .sort(([groupA], [groupB]) => {
                if (groupA === "help" && groupB !== "help") return -1;
                if (groupA !== "help" && groupB === "help") return 1;
                return 0;
            });

        const reply = "```\n"
            + commandsAssocList.reduce((acc, [group, commands]) => {
                const isValidGroup = group && group !== "help";     // help should not be shown separately
                return acc + (isValidGroup ? "```\n**" + CoreTools.capitalize(group) + ":**\n```" : "")
                    + commands.reduce((acc, command) => acc + currentPrefix + command.usage! + "\n", "");
            }, "") + "```";
        
        const embed = CoreTools.createEmbed("neutral", {
            title:  "**Help:**",
            desc:   reply,
            footer: footerNote
        });
        msg.channel.send(embed);
        console.log(`${msg.author.username}#${msg.author.discriminator} queried the general help sheet`);
}

function querySpecificHelpSheet(combData: types.CombinedData, targetCommand: string) {
    const { data, msg } = combData;
    const currentPrefix = CoreTools.getPrefix(data, msg.guild!.id);

    const cmdList = getCmdList(msg);
    const command = cmdList.find(x => CoreTools.removeAccents(x.name.toLowerCase()) === targetCommand
        || x.aliases?.map(x => CoreTools.removeAccents(x.toLowerCase()))?.includes(targetCommand));
        
    if (!command) {
        const embed = CoreTools.createEmbed("error", `Command \`${targetCommand}\` does not exist.`);
        msg.channel.send(embed);
        return;
    }
    
    const usage = "`" + currentPrefix + command.usage! + "`";
    const commandName = currentPrefix + command.name;
    const aliases = (command.aliases ? "alias: " + command.aliases.map(x => currentPrefix+x).join(", ") : "");
    const description = command.description || "**[Description not provided]**";
    const examples = (command.examples ? "**eg:  " +
        command.examples.map(x => x ? `\`${commandName} ${x}\`` : `\`${commandName}\``) 
                        .join(", ") + "**"
    : "");

    const requiredPermission = command.permissions
        ?.map(x => x.description ? "- " + x.description : x.description)
        ?.filter(x => x)
        ?.join("\n");

    const reply = description + (requiredPermission ? "\n\n**Permissions:**\n" + requiredPermission : "") + "\n\n" + examples;

    const embed = CoreTools.createEmbed("neutral", {
        title:  usage,
        desc:   reply,
        footer: aliases
    });
    msg.channel.send(embed);
    console.log(`${msg.author.username}#${msg.author.discriminator} queried the help sheet for '${targetCommand}'`);
}

module.exports = cmd;

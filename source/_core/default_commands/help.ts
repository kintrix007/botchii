import * as CoreTools from "../core_tools";
import * as types from "../types";
import { getCmd, getPermittedCmdList } from "../commands";

const cmd: types.Command = {
    func: cmdHelp,
    name: "help",
    group: "help",
    usage: "help [command name]",
    description: "Gives you a list of commands, or it can give further information about a specific command.",
    examples: [ [], ["prefix"] ]
};

const footerNote = "[] means optional arguements, <> means obligatory arguements, | separates options";

function cmdHelp(combData: types.CombinedData) {
    const targetCommand = combData.args[0];

    if (targetCommand === undefined) {
        queryGeneralHelpSheet(combData);
    } else {
        querySpecificHelpSheet(combData, targetCommand);
    }
}

function queryGeneralHelpSheet({ data, msg }: types.CombinedData) {
    const currentPrefix = CoreTools.getPrefix(msg.guild!.id);
    const cmdList = getPermittedCmdList(msg, true);

    type ExtendedGroup = types.CommandGroup | "uncategorized";
    let commandsInGroups: { [K in ExtendedGroup]?: types.Command[] } = {};

    cmdList.forEach(command => {
        const group = command.group ?? "uncategorized";
        if (commandsInGroups[group] === undefined) {
            commandsInGroups[group] = [];
        }
        commandsInGroups[group]!.push(command);
    });

    const commandsAssocList = Object.entries(commandsInGroups)
    .filter((x): x is [ExtendedGroup, types.Command[]] => x[1] !== undefined)
    .sort((a, b) => {
        const [ [groupA], [groupB] ] = [a, b];
        const [ isHelpA, isHelpB ] = [ groupA === "help", groupB === "help" ];
        const [ isNoneA, isNoneB ] = [ groupA === "uncategorized", groupB === "uncategorized" ];
        const boost = (+isHelpB - +isHelpA) * 2 + (+isNoneA - +isNoneB) * 2;
        return a.toString().localeCompare(b.toString()) + boost;
    });
    
    const reply = commandsAssocList.map(([group, commands]) => {
        const isShownGroup = group !== "help";
        const commandsUsage = commands.map(
            cmd => (cmd.usage instanceof Array
            ? cmd.usage.map(x => currentPrefix + x).join(" OR\n")
            : currentPrefix + cmd.usage!)
        ).join("\n");
        return (isShownGroup ? `**${CoreTools.capitalize(group)}**:\n` : "") + "```" + commandsUsage + "```";
    }).join("\n");
    
    CoreTools.sendEmbed(msg, "neutral", {
        title:  "Help:",
        desc:   reply,
        footer: footerNote
    });
}

function querySpecificHelpSheet({ data, msg }: types.CombinedData, targetCommand: string) {
    const currentPrefix = CoreTools.getPrefix(msg.guild!.id);
    const command = getCmd(targetCommand);
        
    if (!command) {
        CoreTools.sendEmbed(msg, "error", `Help sheet for \`${targetCommand}\` not found, or the command doesn't exist.`);
        return;
    }
    
    const usage       = "`" + currentPrefix + command.usage! + "`";
    const commandName = currentPrefix + command.name;
    const aliases     = (command.aliases?.length ? "alias: " + command.aliases.map(x => currentPrefix+x).join(", ") : "");
    const description = command.description || "**[Description not provided]**";
    const examples    = (command.examples
        ? "**eg:  " + command.examples.map(ex => "`" + [commandName, ...ex].join(" ") + "`").join(", ") + "**"
        : "");

    const requiredPermission = command.permissions
        ?.map(perm => perm.description ? "- " + perm.description : undefined)
        ?.filter((x): x is string => x !== undefined)
        ?.join("\n");

    const reply = description + (requiredPermission ? "\n\n**Permissions:**\n" + requiredPermission : "") + "\n\n" + examples;

    CoreTools.sendEmbed(msg, "neutral", {
        title:  usage,
        desc:   reply,
        footer: aliases
    });
}

module.exports = cmd;

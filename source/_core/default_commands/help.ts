import { getPrefix, capitalize, sendEmbed, Command, CommandCallData, CommandGroup } from "../bot_core";
import { getCmd, getPermittedCmdList } from "../commands";

export default {
    call: cmdHelp,
    name: "help",
    group: "help",
    usage: "help [command name]",
    description: "Gives you a list of commands, or it can give further information about a specific command.",
    examples: [ [], ["prefix"] ],
} as Command;

const footerNote = "[] means optional arguements, <> means obligatory arguements, | separates options";

function cmdHelp(cmdCall: CommandCallData) {
    const targetCommand = cmdCall.args[0];

    if (targetCommand === undefined) {
        queryGeneralHelpSheet(cmdCall);
    } else {
        querySpecificHelpSheet(cmdCall, targetCommand);
    }
}

function queryGeneralHelpSheet(cmdCall: CommandCallData) {
    const { msg } = cmdCall;
    const currentPrefix = getPrefix(msg.guild!.id);
    const cmdList = getPermittedCmdList(cmdCall, true);

    type ExtendedGroup = CommandGroup | "uncategorized";
    let commandsInGroups: { [K in ExtendedGroup]?: Command[] } = {};

    cmdList.forEach(command => {
        const group = command.group ?? "uncategorized";
        if (commandsInGroups[group] === undefined) {
            commandsInGroups[group] = [];
        }
        commandsInGroups[group]!.push(command);
    });

    const commandsAssocList = Object.entries(commandsInGroups)
    .sort((a, b) => {
        const [ [groupA], [groupB] ] = [a, b];
        const [ isHelpA, isHelpB ] = [ groupA === "help", groupB === "help" ];
        const [ isNoneA, isNoneB ] = [ groupA === "uncategorized", groupB === "uncategorized" ];
        const boost = (-+isHelpA + +isHelpB) * 2 + (+isNoneA - +isNoneB) * 2;
        return groupA.localeCompare(groupB) + boost;
    });

    const reply = commandsAssocList.map(([group, commands]) => {
        const isShownGroup = group !== "help";
        const commandsUsage = commands.map(
            ({ usage }) => (usage instanceof Array
            ? usage.map(x => currentPrefix + x).join(" OR\n")
            : currentPrefix + usage!)
        ).join("\n");
        console.log({group, commandsUsage});
        return (isShownGroup ? `**${capitalize(group)}**:\n` : "") + "```\n" + commandsUsage + "\n```";
    }).join("\n");
    
    sendEmbed(msg, "neutral", {
        title:  "Help:",
        desc:   reply,
        footer: footerNote
    });
}

function querySpecificHelpSheet({ msg }: CommandCallData, targetCommand: string) {
    const currentPrefix = getPrefix(msg.guild!.id);
    const command = getCmd(targetCommand, true);
        
    if (!command) {
        sendEmbed(msg, "error", `Help sheet for \`${targetCommand}\` not found, or the command doesn't exist.`);
        return;
    }
    
    const usage       = "`" + (command.usage instanceof Array
        ? command.usage.map(x => currentPrefix + x).join(" OR\n")
        : currentPrefix + command.usage!)
    + "`";
    const commandName = currentPrefix + command.name;
    const aliases     = (command.aliases?.length ? "alias: " + command.aliases.map(x => currentPrefix+x).join(", ") : "");
    const description = command.description || "**[Description not provided]**";
    const examples    = (command.examples
        ? "**eg:  " + command.examples.map(ex => "`" + [commandName, ...ex].join(" ") + "`").join(", ") + "**"
        : "");

    const requiredPermissionStr = command.permissions
        ?.map(perm => perm.description ? "**-** " + perm.description(command) : undefined)
        ?.filter((x): x is string => x !== undefined)
        ?.join("\n");

    const reply = description + (requiredPermissionStr ? "\n\n**Permissions:**\n" + requiredPermissionStr : "") + "\n\n" + examples;

    sendEmbed(msg, "neutral", {
        title:  usage,
        desc:   reply,
        footer: aliases
    });
}

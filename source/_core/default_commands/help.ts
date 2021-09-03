import { notOf } from "../utils/general_utils";
import { getPrefix, capitalize, Command, CommandCallData, createEmbed } from "../bot_core";
import { getCmd, getPermittedCmdList } from "../commands";

export default <Command>{
    call: cmdHelp,
    name: "help",
    group: "help",
    usage: "help [command name]",
    description: "Gives you a list of commands, or it can give further information about a specific command.",
    examples: [ [], ["prefix"] ],
};

const footerNote = "[] means optional arguements, <> means obligatory arguements, | separates options";

function cmdHelp(cmdCall: CommandCallData) {
    const targetCommand = cmdCall.args[0];

    if (targetCommand === undefined) {
        return queryGeneralHelpSheet(cmdCall);
    } else {
        return querySpecificHelpSheet(cmdCall, targetCommand);
    }
}

function queryGeneralHelpSheet(cmdCall: CommandCallData) {
    const { msg } = cmdCall;
    const currentPrefix = getPrefix(msg.guild!.id);
    const cmdList = getPermittedCmdList(cmdCall, true);

    // vv Fuck TypeScript, why this no work??? vv
    //* type ExtendedGroup = CommandGroup | "uncategorized";
    //* let commandsInGroups: { [K in ExtendedGroup]?: Command[] } = {};
    let commandsInGroups: { [group: string]: Command[] | undefined } = {};

    cmdList.forEach(command => {
        const group = command.group ?? "uncategorized" as keyof typeof commandsInGroups;
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
        const commandsUsage = commands!.map(
            ({ usage }) => (usage instanceof Array
            ? usage.map(x => currentPrefix + x).join(" OR\n")
            : currentPrefix + usage!)
        ).join("\n");
        return `**${capitalize(group)}**:\n` + "```\n" + commandsUsage + "\n```";
    }).join("\n");

    return createEmbed("neutral", {
        title:  "__General Helpsheet__:",
        desc:   reply,
        footer: footerNote
    });
}

function querySpecificHelpSheet({ msg }: CommandCallData, targetCommand: string) {
    const currentPrefix = getPrefix(msg.guild!.id);
    const command = getCmd(targetCommand, true);
        
    if (!command) return createEmbed("error", `Help sheet for \`${targetCommand}\` not found, or the command doesn't exist.`);
    
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

    const permString = (() => {
        if (command.permissions === undefined) return undefined;
        const possiblePermDescriptions = command.permissions?.map(x => x.description?.(command));
        const hasPermissionWihtoutDescription = possiblePermDescriptions.some(x => x === undefined);
        const permDescriptions = possiblePermDescriptions.filter(notOf(undefined));
        
        let permDescStr = permDescriptions.map(x => `- ${x}`).join("\n");
        if (hasPermissionWihtoutDescription) {
            permDescStr += "\n- *And others, unspecified...*";
        }
        return permDescStr;
    })();

    const reply =
        description
        + (permString !== undefined ? "\n\n**Permissions:**\n" + permString : "")
        + "\n\n" + examples;

    return createEmbed("neutral", {
        title:  usage,
        desc:   reply,
        footer: aliases
    });
}

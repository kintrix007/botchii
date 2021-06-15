import * as BotUtils from "../bot_utils";
import { Command, CommandCallData, CommandGroup } from "../types";
import { getCmd, getPermittedCmdList } from "../commands";

const cmd: Command = {
    call: cmdHelp,
    name: "help",
    group: "help",
    usage: "help [command name]",
    description: "Gives you a list of commands, or it can give further information about a specific command.",
    examples: [ [], ["prefix"] ]
};

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
    const currentPrefix = BotUtils.getPrefix(msg.guild!.id);
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
    .filter((x): x is [ExtendedGroup, Command[]] => x[1] !== undefined)
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
        return (isShownGroup ? `**${BotUtils.capitalize(group)}**:\n` : "") + "```" + commandsUsage + "```";
    }).join("\n");
    
    BotUtils.sendEmbed(msg, "neutral", {
        title:  "Help:",
        desc:   reply,
        footer: footerNote
    });
}

function querySpecificHelpSheet({ msg }: CommandCallData, targetCommand: string) {
    const currentPrefix = BotUtils.getPrefix(msg.guild!.id);
    const command = getCmd(targetCommand, true);
        
    if (!command) {
        BotUtils.sendEmbed(msg, "error", `Help sheet for \`${targetCommand}\` not found, or the command doesn't exist.`);
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

    BotUtils.sendEmbed(msg, "neutral", {
        title:  usage,
        desc:   reply,
        footer: aliases
    });
}

module.exports = cmd;

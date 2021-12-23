"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const general_utils_1 = require("../utils/general_utils");
const bot_core_1 = require("../bot_core");
const commands_1 = require("../commands");
exports.default = {
    call: cmdHelp,
    name: "help",
    group: "help",
    usage: "help [command name]",
    description: "Gives you a list of commands, or it can give further information about a specific command.",
    examples: [[], ["prefix"]],
};
const footerNote = "[] means optional arguements, <> means obligatory arguements, | separates options";
function cmdHelp(cmdCall) {
    const targetCommand = cmdCall.args[0];
    if (targetCommand === undefined) {
        return queryGeneralHelpSheet(cmdCall);
    }
    else {
        return querySpecificHelpSheet(cmdCall, targetCommand);
    }
}
function queryGeneralHelpSheet(cmdCall) {
    const { msg } = cmdCall;
    const currentPrefix = bot_core_1.getPrefix(msg.guild.id);
    const cmdList = commands_1.getPermittedCmdList(cmdCall);
    // vv Fuck TypeScript, why this no work??? vv
    //* type ExtendedGroup = CommandGroup | "uncategorized";
    //* let commandsInGroups: { [K in ExtendedGroup]?: Command[] } = {};
    let commandsInGroups = {};
    cmdList.forEach(command => {
        var _a;
        const group = (_a = command.group) !== null && _a !== void 0 ? _a : "uncategorized";
        if (commandsInGroups[group] === undefined) {
            commandsInGroups[group] = [];
        }
        commandsInGroups[group].push(command);
    });
    const commandsAssocList = Object.entries(commandsInGroups)
        .sort((a, b) => {
        const [[groupA], [groupB]] = [a, b];
        const [isHelpA, isHelpB] = [groupA === "help", groupB === "help"];
        const [isNoneA, isNoneB] = [groupA === "uncategorized", groupB === "uncategorized"];
        const boost = (-+isHelpA + +isHelpB) * 2 + (+isNoneA - +isNoneB) * 2;
        return groupA.localeCompare(groupB) + boost;
    });
    const reply = commandsAssocList.map(([group, commands]) => {
        const commandsUsage = commands.map(({ usage }) => (usage instanceof Array
            ? usage.map(x => currentPrefix + x).join(" OR\n")
            : currentPrefix + usage)).join("\n");
        return `**${bot_core_1.capitalize(group)}**:\n` + "```\n" + commandsUsage + "\n```";
    }).join("\n");
    return bot_core_1.createEmbed("neutral", {
        title: "__General Helpsheet__:",
        desc: reply,
        footer: footerNote
    });
}
function querySpecificHelpSheet({ msg }, targetCommand) {
    var _a;
    const currentPrefix = bot_core_1.getPrefix(msg.guild.id);
    const command = commands_1.getCmd(targetCommand, true);
    if (!command)
        return bot_core_1.createEmbed("error", `Help sheet for \`${targetCommand}\` not found, or the command doesn't exist.`);
    const usage = "`" + (command.usage instanceof Array
        ? command.usage.map(x => currentPrefix + x).join(" OR\n")
        : currentPrefix + command.usage)
        + "`";
    const commandName = currentPrefix + command.name;
    const aliases = (((_a = command.aliases) === null || _a === void 0 ? void 0 : _a.length) ? "alias: " + command.aliases.map(x => currentPrefix + x).join(", ") : "");
    const description = command.description || "**[Description not provided]**";
    const examples = (command.examples
        ? "**eg:  " + command.examples.map(ex => "`" + [commandName, ...ex].join(" ") + "`").join(", ") + "**"
        : "");
    const permString = (() => {
        var _a;
        if (command.permissions === undefined)
            return undefined;
        const possiblePermDescriptions = (_a = command.permissions) === null || _a === void 0 ? void 0 : _a.map(x => { var _a; return (_a = x.description) === null || _a === void 0 ? void 0 : _a.call(x, command); });
        const hasPermissionWihtoutDescription = possiblePermDescriptions.some(x => x === undefined);
        const permDescriptions = possiblePermDescriptions.filter(general_utils_1.notOf(undefined));
        let permDescStr = permDescriptions.map(x => `- ${x}`).join("\n");
        if (hasPermissionWihtoutDescription) {
            permDescStr += "\n- *And others, unspecified...*";
        }
        return permDescStr;
    })();
    const reply = description
        + (permString !== undefined ? "\n\n**Permissions:**\n" + permString : "")
        + "\n\n" + examples;
    return bot_core_1.createEmbed("neutral", {
        title: usage,
        desc: reply,
        footer: aliases
    });
}

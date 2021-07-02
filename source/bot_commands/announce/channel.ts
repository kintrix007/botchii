import { adminPermission, Command, CommandCallData, sendEmbed } from "../../_core/bot_core";
import cmdAlias from "./alias";
import cmdSetChannel from "./set_channel";
import cmdGetChannel from "./get_channel"

const description = `Lets you create aliases to channels, set the default announce target, and the channels, where they will be sent from.
An alias can refer to one or more channels. e.g. \`fun\` could refer to \`#general\` and \`#memes\`.
The base channels are where the bot is allowed to announce messages from.
The target channels are what botchii defaults to when using the \`announce\` command.`;

const cmd: Command = {
    call:        cmdChannel,
    name:        "channel",
    permissions: [ adminPermission ],
    group:       "announcement",
    aliases:     [ "channels" ],
    usage: [
        "channel <alias> [<name> <channels...>]",
        "channel <from|base> <channels...>",
        "channel <to|target> <channels...>"
    ],
    description: description,
    examples:    [ [], ["alias"], ["alias", "general", "123456789012345678"], ["from", "#announcements"], ["to", "general", "#memes"] ]
};

async function cmdChannel(cmdCall : CommandCallData) {
    const { coreData, msg, args } = cmdCall;
    const mode = args[0];
    if (mode === undefined) {
        await cmdGetChannel(cmdCall);
        return;
    }
    
    const subCmdCall = {
        msg, coreData,
        cmdName: mode,
        args:    args.slice(1),
        argsStr: args.slice(1).join(" "),
        cont:    args.join(" ")
    };

    if ([ "alias", "aliases" ].includes(mode)) {
        await cmdAlias(subCmdCall);
    } else
    if ([ "from", "base" ].includes(mode)) {
        await cmdSetChannel(subCmdCall, "base");
    } else
    if ([ "to", "target" ].includes(mode)) {
        await cmdSetChannel(subCmdCall, "target");
    } else {
        sendEmbed(msg, "error", `\`${mode}\` is not a valid arguement for \`channel\`!`);
    }
}

module.exports = cmd;

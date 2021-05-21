import * as CoreTools from "../../_core/core_tools";
import * as types from "../../_core/types";
import { ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";
import cmdAlias from "./alias";
import cmdSetChannel from "./set_channel";
import cmdGetChannel from "./get_channel"


const cmd: types.Command = {
    func:        cmdChannel,
    name:        "channel",
    permissions: [ types.adminPermission ],
    group:       "announcement",
    aliases:     [ "channels" ],
    usage:       "channel <<<alias> <name> <channels...>> | <from|base> <channels...>> | <<to|target> <channels...>>",
    description: "",
    examples:    [ "", "alias general 123456789012345678", "from #announcements", "to general #memes" ]
};

async function cmdChannel({ data, msg, args } : types.CombinedData) {
    const mode = args[0];
    const subCombData = {
        msg, data,
        cmdName: args[0],
        args:    args.slice(1),
        argsStr: args.slice(1).join(" "),
        cont:    args.join(" ")
    };
    
    if ([ "alias", "aliases" ].includes(mode)) {
        await cmdAlias(subCombData);
    } else
    if ([ "from", "base" ].includes(mode)) {
        await cmdSetChannel(subCombData, "base");
    } else
    if ([ "to", "target" ].includes(mode)) {
        await cmdSetChannel(subCombData, "target");
    } else
    if (mode === undefined) {
        await cmdGetChannel(subCombData);
    } else {
        CoreTools.sendEmbed(msg, "error", `\`${mode}\` is not a valid arguement for \`channel\`!`);
    }
}

module.exports = cmd;

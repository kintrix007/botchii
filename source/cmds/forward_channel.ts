import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";

const cmd: types.Command = {
    setupFunc: setup,
    name: "channel",
    func: cmdChannel,
    usage: "channel <from|to> [channels...]",
    // description: "",
    examples: [ "from", "from 123456789012345678 012345678901234567", "to 234567890123456789" ]
}

const PREFS_FILE = "channel.json";

export interface ChannelData {
    [guildID: string]: {
        readableGuildName: string;
        fromChannels: string[];
        toChannels: string[];
    };
}

async function setup(data: types.Data) {
    const channelData: ChannelData = Utilz.loadPrefs(PREFS_FILE);
}

function cmdChannel({msg, args}: types.CombinedData) {
    const [option, ...channelIDs] = args;
    const isFromSetter = option === "from";
}

module.exports = cmd;

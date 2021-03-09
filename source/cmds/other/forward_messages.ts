import * as Utilz from "../../classes/utilz";
import * as types from "../../classes/types";
import { ChannelData, PREFS_FILE } from "../set_channel"
import { Client } from "discord.js";

export default async function setup(data: types.Data) {
    const channelData: ChannelData = Utilz.loadPrefs(PREFS_FILE);
}

function cacheChannelMessages(client: Client, channelIDs: string[]) {

}

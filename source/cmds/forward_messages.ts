import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { ChannelData, PREFS_FILE } from "./set_channel"
import { Client, DMChannel, MessageReaction, User } from "discord.js";

const cmd: types.Command = {
    name: "",
    func: () => 0,
    setupFunc: setup
};

async function setup(data: types.Data) {
    const channelData: ChannelData = Utilz.loadPrefs(PREFS_FILE);
    
    console.log("caching messages...");
    Object.entries(channelData).forEach(([guildID, guildData]) => {
        if (guildData.fromChannels) cacheChannelMessages(data.client, guildData.fromChannels);
    });
    console.log("successfully cached messages");

    data.client.on("messageReactionAdd", async (reaction, user) => {
        if (!(user instanceof User)) return;
        const msg = reaction.message;
        if (msg.channel instanceof DMChannel) return;

        const guildID = msg.guild!.id;
        const fromChannels = channelData[guildID]?.fromChannels;
        const toChannels = channelData[guildID]?.toChannels;
        
        if (!fromChannels?.includes(msg.id)) return;
        
        const reactions = Array.from(reaction.message.reactions.cache.values())
            .map(({ emoji, count }): [string | null, string, number | null] => [ emoji.id, emoji.identifier, count ]);

        console.log(reactions);
    });
}

function cacheChannelMessages(client: Client, channelIDs: string[]) {
    channelIDs.forEach(ID => client.channels.fetch(ID));
}

module.exports = cmd;

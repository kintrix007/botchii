import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { CategoryChannel, Channel, Client, Message, MessageEmbed, VoiceChannel } from "discord.js";

const cmd: types.Command = {
    name: "channel",
    func: cmdChannel,
    usage: "channel [<from|to> <channels...>]",
    // description: "",
    examples: [ "from", "from #general #announcements 012345678901234567", "to #published-announcements" ],
    adminCommand: true,
    group: "admin"
};

export const PREFS_FILE = "channel.json";

export interface ChannelData {
    [guildID: string]: {
        readableGuildName:  string;
        fromChannels?:      string[];
        toChannels?:        string[];
    };
}

async function cmdChannel({data, msg, args}: types.CombinedData) {
    const [option, ...strIDs] = args;
    const isFromSetter = option === "from";
    const isSetter = (isFromSetter || option === "to");

    const channelIDs = stripIDs(strIDs);
    const channels = await fetchChannels(data.client, channelIDs);

    if (channels.length === 0 && isSetter) {
        const embed = new MessageEmbed()
            .setColor(0xbb0000)
            .setDescription("Error");
        msg.channel.send(embed);
        return;
    }
    
    if (isSetter) {

        setChannels(msg, channels, isFromSetter);

    } else {
        // getter
        const guildID = msg.guild!.id;
        const channelData: ChannelData = Utilz.loadPrefs(PREFS_FILE);

        const fromChannels = channelData[guildID]?.fromChannels;
        const toChannels = channelData[guildID]?.toChannels;
        
        const channelsToString = (channels: string[] | undefined) =>
            (channels ? channels.map(x => `<#${x}>`).reduce((a, b) => a + ", " + b) : "none");
        
        const embed = new MessageEmbed()
            .setColor(0x00bb00)
            .setDescription(`Base channels: ${channelsToString(fromChannels)}\nTarget channels: ${channelsToString(toChannels)}`);
        msg.channel.send(embed);
    }
}

function stripIDs(strIDs: string[]) {
    const regex = /^(?:<#(\d+)>|(\d+))$/i; // "<#id>" or "id"
    return strIDs.map(x => {
        const match = x.match(regex);
        if (!match) return undefined;
        return match[1] ?? match[2];
    }).filter(x => x !== undefined) as string[];
}

async function fetchChannels(client: Client, IDs: string[]): Promise<Channel[]> {
    const channelPromises: Promise<Channel|CategoryChannel>[] = IDs.map(async x => client.channels.fetch(x));

    let channels: (Channel | undefined)[] = [];
    for (let i = 0; i < channelPromises.length; i++) {
        try {
            const channel = await channelPromises[i];
            if (channel instanceof CategoryChannel) {
                channels = [...channels, ...Array.from(channel.children.values()).filter(x => !(x instanceof VoiceChannel))];
            } else {
                if (channel instanceof VoiceChannel) continue;
                channels.push(channel);
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    return channels.filter(x => x !== undefined) as Channel[];
}

function setChannels(msg: Message, channels: Channel[], fromSetter: boolean) {
    const guildID = msg.guild!.id;
    const channelData: ChannelData = Utilz.loadPrefs(PREFS_FILE);

    if (fromSetter) {
        // from
        channelData[guildID] = {
            readableGuildName: msg.guild!.name,
            fromChannels: channels.map(x => x.id),
            toChannels: channelData[guildID]?.toChannels
        };
    } else {
        // to
        channelData[guildID] = {
            readableGuildName: msg.guild!.name,
            fromChannels: channelData[guildID]?.fromChannels, 
            toChannels: channels.map(x => x.id)
        };
    }
    Utilz.savePrefs(PREFS_FILE, channelData);
    
    const embed = new MessageEmbed()
        .setColor(0x00bb00)
        .setTitle(`Successfully set ${fromSetter ? "base" : "target"} channel${channels.length === 1 ? "" : "s"}!`)
        .setDescription("Channels: " + channels.map(x => `<#${x.id}>`).reduce((a, b) => a + ", " + b));
    msg.channel.send(embed);
}


module.exports = cmd;

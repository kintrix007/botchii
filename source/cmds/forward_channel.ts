import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { CategoryChannel, Channel, Client, Message, MessageEmbed, VoiceChannel } from "discord.js";

const cmd: types.Command = {
    name: "channel",
    func: cmdChannel,
    usage: "channel [<from|to> <channels...>]",
    // description: "",
    examples: [ "from", "from 123456789012345678 012345678901234567", "to 234567890123456789" ]
}

const PREFS_FILE = "channel.json";

export interface ChannelData {
    [guildID: string]: {
        readableGuildName:  string;
        fromChannels?:      string[];
        toChannels?:        string[];
    };
}

async function cmdChannel({data, msg, args}: types.CombinedData) {
    const [option, ...strIDs] = args;
    const isToSetter = option === "to";
    const isFromSetter = option === "from";
    const isGetter = !(isToSetter || isFromSetter);

    if (!strIDs.length && !isGetter) {
        const embed = new MessageEmbed()
            .setColor(0xbb0000)
            .setDescription("Error");
        msg.channel.send(embed);
        return;
    }

    const channelIDs = stripIDs(strIDs);

    if (!channelIDs.length && !isGetter) {
        const embed = new MessageEmbed()
            .setColor(0xbb0000)
            .setDescription("Error");
        msg.channel.send(embed);
        return;
    }

    const guildID = msg.guild!.id;
    const channels = await fetchChannels(data.client, channelIDs);

    if (!channels.length && !isGetter) {
        const embed = new MessageEmbed()
            .setColor(0xbb0000)
            .setDescription("Error");
        msg.channel.send(embed);
        return;
    }

    const channelData: ChannelData = Utilz.loadPrefs(PREFS_FILE);
    
    if (isFromSetter) {

        channelData[guildID] = {
            readableGuildName: msg.guild!.name,
            fromChannels: channels.map(x => x.id),
            toChannels: channelData[guildID]?.toChannels
        };
        Utilz.savePrefs(PREFS_FILE, channelData);

    } else
    if (isToSetter) {
        
        channelData[guildID] = {
            readableGuildName: msg.guild!.name,
            fromChannels: channelData[guildID]?.fromChannels, 
            toChannels: channels.map(x => x.id)
        };
        Utilz.savePrefs(PREFS_FILE, channelData);
        
    } else {
        // neither "from", nor "to"
        const { fromChannels, toChannels } = channelData[guildID];
        const channelsToString = (channels: string[] | undefined) =>
            (channels ? channels.map(x => `<#${x}>`).reduce((a, b) => a + ", " + b) : "none");
        const embed = new MessageEmbed()
            .setColor(0x00bb00)
            .setDescription(`Base channels: ${channelsToString(fromChannels)}\nTarget channels: ${channelsToString(toChannels)}`);
        msg.channel.send(embed);
        return;
    }

    const embed = new MessageEmbed()
        .setColor(0x00bb00)
        .setTitle(`Successfully set ${isFromSetter ? "base" : "target"} channel${channels.length === 1 ? "" : "s"}!`)
        .setDescription("Channels: " + channels.map(x => `<#${x.id}>`).reduce((a, b) => a + ", " + b));
    msg.channel.send(embed);
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
                console.log(channel);
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


module.exports = cmd;

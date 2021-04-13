import * as CoreTools from "../_core/core_tools";
import * as types from "../_core/types";
import { CategoryChannel, Channel, Client, Guild, GuildChannel, Message, VoiceChannel } from "discord.js";

const description = "Sets the base and the target channels."
    + "\nOnce a message in a base channel is accepted, it will be sent in every one of the target channels."
    + "\nYou can also provide the ID's of categories. This way, all the channels under a category will be added individually."
    + "\nIf used without arguements, lists the currently set base and target channels.";

const cmd: types.Command = {
    func: cmdChannel,
    name: "channel",
    permissions: [ types.adminPermission ],
    group: "admin",
    aliases: [ "channels" ],
    usage: "channel [<base|target> <channels...>]",
    description: description,
    examples: [ "", "from #general #announcements 012345678901234567", "to #published-announcements" ]
};

export const CHANNEL_PREFS_FILE = "channel.json";

export interface ChannelData {
    [guildID: string]: {
        readableGuildName:  string;
        fromChannels?:      string[];
        toChannels?:        string[];
    };
}

async function cmdChannel({data, msg, args}: types.CombinedData) {
    const [option, ...strIDs] = args;
    const isFromSetter = [ "base", "from" ].includes(option);
    const isToSetter   = [ "target", "to" ].includes(option);
    const isSetter = (isFromSetter || isToSetter);

    const channelIDs = stripIDs(strIDs);
    const channels = await fetchChannels(data.client, msg.guild!, channelIDs);

    if (channels.length === 0 && isSetter) {
        const embed = CoreTools.createEmbed("error", "No valid channels given!");
        msg.channel.send(embed);
        return;
    }
    
    if (isSetter) {

        setChannels(msg, channels, isFromSetter);

    } else {
        // getter
        const guildID = msg.guild!.id;
        const channelData: ChannelData = CoreTools.loadPrefs(CHANNEL_PREFS_FILE);

        const fromChannels = channelData[guildID]?.fromChannels;
        const toChannels = channelData[guildID]?.toChannels;
        
        const channelsToString = (channels: string[] | undefined) =>
            (channels ? channels.map(x => `<#${x}>`).join(", ") : "none set");
        
        const embed = CoreTools.createEmbed("ok", `**Base channels:** ${channelsToString(fromChannels)}\n**Target channels:** ${channelsToString(toChannels)}`);
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

async function fetchChannels(client: Client, guild: Guild, IDs: string[]): Promise<Channel[]> {
    const channelPromises: Promise<Channel|GuildChannel|CategoryChannel>[] = IDs.map(async x => client.channels.fetch(x));

    let channels: (Channel | undefined)[] = [];
    for (let i = 0; i < channelPromises.length; i++) {
        try {
            const channel = await channelPromises[i];

            if (!(channel instanceof GuildChannel)) continue;
            if (channel.guild.id !== guild.id) continue;

            if (channel instanceof CategoryChannel) {
                channels = [...channels, ...Array.from(channel.children.values())];
            } else {
                channels.push(channel);
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    return channels.filter(x => x !== undefined && !(x instanceof VoiceChannel)) as Channel[];
}

function setChannels(msg: Message, channels: Channel[], fromSetter: boolean) {
    const guildID = msg.guild!.id;
    const channelData: ChannelData = CoreTools.loadPrefs(CHANNEL_PREFS_FILE);

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
    CoreTools.savePrefs(CHANNEL_PREFS_FILE, channelData);
    
    const embed = CoreTools.createEmbed("ok", {
       title: `Successfully set ${fromSetter ? "base" : "target"} channel${channels.length === 1 ? "" : "s"}!`,
       desc:  "Channels: " + channels.map(x => `<#${x.id}>`).join(", ")
    });
    msg.channel.send(embed);
}


module.exports = cmd;

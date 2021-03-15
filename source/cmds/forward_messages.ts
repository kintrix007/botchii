import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { ChannelData } from "./set_channel"
import { Client, DMChannel, GuildEmoji, Message, MessageEmbed, MessageReaction, PartialUser, TextChannel, User } from "discord.js";

const CHANNEL_PREFS_FILE = "channel.json";
const EMOJI_PREFS_FILE = "emojis.json";

const acceptSign = "✅";
const rejectSign = "❌";
const announcedEmoji = "derp:821087663481684038"; //"👌";
const differeceToForward        = 2;    // the message needs to have this much more accepts than rejects
const truncateQuickReplyMsgTo   = 30;   // this is how short the quick vote feeback message gets truncated to

const acceptEmojis = [ "✅", "☑️" ];
const rejectEmojis = [ "❎", "❌" ];

const cmd: types.Command = {
    name: "channelSetup",
    func: () => 0,
    setupFunc: setup
};

interface CountedEmoji {
    isCustom:   boolean;
    string:     string;
    count:      number;
    users:      User[];
    isInvalid?: boolean;
}

async function setup(data: types.Data) {
    
    
    const channelData: ChannelData = Utilz.loadPrefs(CHANNEL_PREFS_FILE);
    await cacheMessages(data.client, channelData);

    data.client.on("messageReactionAdd",    trackReactions(data, channelData, true));
    data.client.on("messageReactionRemove", trackReactions(data, channelData, false));
}

function trackReactions(data: types.Data, channelData: ChannelData, isReactionAdd: boolean) {
    return async (reaction: MessageReaction, user: User | PartialUser) => {
        if (user.bot) return;
        if (!(user instanceof User)) return;

        const isTrackedReaction = [...acceptEmojis, ...rejectEmojis].includes(reaction.emoji.name);
        if (!isTrackedReaction) return;

        const msg = reaction.message;
        if (msg.channel instanceof DMChannel) return;

        const guildID = msg.guild!.id;
        const fromChannels = channelData[guildID]?.fromChannels;
        const toChannels = channelData[guildID]?.toChannels;
        const reactions = Array.from(msg.reactions.cache.values());

        // cache users for later use
        for (const reaction of reactions) {
            await reaction.users.fetch();
        }

        if (!fromChannels?.includes(msg.channel.id)) return;
        if (await isAlreadyAnnounced(reactions)) return;

        const emojis = removeDuplicateUserReactions(await convertToCustromEmojis(reactions));
        const emojiAccepts = emojis.filter(x => acceptEmojis.includes(x.string));
        const emojiRejects = emojis.filter(x => rejectEmojis.includes(x.string));
            
        const acceptCount = emojiAccepts.length;
        const rejectCount = emojiRejects.length;
        const acceptUsers = Utilz.nubBy(emojiAccepts.reduce((a: User[], b) => [...a, ...b.users], []), (a, b) => a.id === b.id);
        
        const truncatedContent = msg.content.length > truncateQuickReplyMsgTo ? msg.content.substr(0, truncateQuickReplyMsgTo) + "..." : msg.content;
        const reply = (msg.content ? "> " + truncatedContent : Utilz.getMessageLink(msg))
            + `\n${acceptSign}\` ${acceptCount}  :  ${rejectCount} \`${rejectSign}`;

        msg.channel.send(reply);

        const shouldForward = acceptCount >= rejectCount + differeceToForward && isReactionAdd;

        if (shouldForward && toChannels) {
            forwardMessage(msg, toChannels, acceptUsers)
        }
    };
}

async function forwardMessage(msg: Message, toChannels: string[], acceptUsers: User[]) {
    const forwardTitle = `**${msg.member?.nickname ?? msg.author.username + " made an announcement"}:**`;
            const forwardContent = msg.content.replace(/@here/g, "`@`here").replace(/@everyone/g, "`@`everyone");
            const forwardAttachments = msg.attachments.array();
            const forwardEmbeds = msg.embeds;

            try {
                for (const channelID of toChannels) {
                    await msg.client.channels.fetch(channelID).then(channel => {
                        (channel as any).send(forwardTitle + "\n" + forwardContent, ...forwardEmbeds, ...forwardAttachments)
                    }).catch(console.error);
                }
                
                msg.react(announcedEmoji);
                const embed = new MessageEmbed()
                    .setColor(0x00bb00)
                    .setTitle("Made an announcement!")
                    .setDescription(`On behalf of: ${acceptUsers}`)
                msg.channel.send(embed);
            }
            catch (err) {
                console.error(err);
            }
}

async function isAlreadyAnnounced(reactions: MessageReaction[]) {
    return reactions.some(reaction =>
        reaction.users.cache.array().some(usr =>
            usr.id === usr.client.user!.id
        ) && reaction.emoji.name === announcedEmoji
    );
}

async function convertToCustromEmojis(reactions: MessageReaction[]) {
    return reactions.map(({emoji, count, users}): CountedEmoji => {
        const isCustom: boolean = emoji instanceof GuildEmoji;
        return {
            isCustom,
            string: isCustom ? `<:${emoji.name}:${emoji.id}>` : emoji.name,
            count: count ?? 0,
            users: Array.from(users.cache.values()),
            isInvalid: !isCustom && emoji.id !== null
        };
    }).filter(x => !x.isInvalid);
}

function removeDuplicateUserReactions(emojis: CountedEmoji[]) {
    return Utilz.nubBy(emojis, (a, b) => a.users.some(x => b.users.some(y => x.id === y.id)));
}

async function cacheMessages(client: Client, channelData: ChannelData) {
    console.log("caching messages...");
    
    for (const [guildID, guildData] of Object.entries(channelData)) {
        if (guildData.fromChannels?.length) {
            const channelCount = await cacheChannelMessages(client, guildData.fromChannels);
            console.log(`successfully cached ${channelCount} messages in '${guildData.readableGuildName}'`);
        }
    }

    console.log("finished caching messages!");
}

async function cacheChannelMessages(client: Client, channelIDs: string[]) {
    let successCount = 0;
    
    for (const ID of channelIDs) {
        try {
            const channel = await client.channels.fetch(ID) as TextChannel;
            const messages = await channel.messages.fetch();
            successCount += messages.size;
        }
        catch (err) {
            console.error(err);
        }
    }

    return successCount;
}

module.exports = cmd;

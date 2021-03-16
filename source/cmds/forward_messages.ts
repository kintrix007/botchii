import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { ChannelData } from "./set_channel"
import { Client, DMChannel, GuildEmoji, Message, MessageEmbed, MessageReaction, PartialUser, TextChannel, User } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { Snowflake } from "discord.js";

const CHANNEL_PREFS_FILE = "channel.json";
const EMOJI_PREFS_FILE = "emojis.json";
const HOUR = 3600000;

const acceptSign        = "✅";
const rejectSign        = "❎";
const announcedEmoji    = "👌";
const scoreToForward    = 3;    // the message needs to have this much more accepts than rejects

const truncateQuickReplyMsgTo = 40;   // this is how short the quick vote feeback message gets truncated to

const acceptEmojis = [ "✅", "☑️", "👍"];
const rejectEmojis = [ "❎", "❌", "👎", "✖️", "🇽"];

const cmd: types.Command = {
    name: "reactions",
    func: cmdChangeEmoji,
    // adminCommand: true,
    // usage: "reaction [<accept|reject> <emojis...>]",
    // description: "",
    // examples: [ "" ],
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

    data.client.on("messageReactionAdd",    trackReactions(data, true));
    data.client.on("messageReactionRemove", trackReactions(data, false));
}

function cmdChangeEmoji({ msg }: types.CombinedData): void {

}

function trackReactions(data: types.Data, isReactionAdd: boolean) {
    return async (reaction: MessageReaction, user: User | PartialUser) => {
        if (user.bot) return;
        if (!(user instanceof User)) return;

        const isTrackedReaction = [...acceptEmojis, ...rejectEmojis].includes(reaction.emoji.name);
        if (!isTrackedReaction) return;

        const msg = reaction.message;
        if (msg.channel instanceof DMChannel) return;

        const channelData: ChannelData = Utilz.loadPrefs(CHANNEL_PREFS_FILE);
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
            
        const acceptCount = emojiAccepts.reduce((acc, emoji) => acc + emoji.count, 0);
        const rejectCount = emojiRejects.reduce((acc, emoji) => acc + emoji.count, 0);
        const acceptUsers = Utilz.nubBy(emojiAccepts.reduce((a: User[], b) => [...a, ...b.users], []), (a, b) => a.id === b.id);
        const score = acceptCount - rejectCount;
        const shouldForward = score > scoreToForward && isReactionAdd;
        

        const truncatedContent = msg.content.length > truncateQuickReplyMsgTo ? msg.content.substr(0, truncateQuickReplyMsgTo) + "..." : msg.content;
        const reply = (msg.content ? "> " + truncatedContent : Utilz.getMessageLink(msg))
            + `\n${acceptSign}\` ${acceptCount}  :  ${rejectCount} \`${rejectSign}    **${scoreToForward-score} to go**`;

        msg.channel.send(reply);
        console.log(`${acceptCount} +    :    - ${rejectCount}`);

        if (toChannels === undefined || toChannels.length === 0) {
            const embed = new MessageEmbed()
                .setColor(0xbb0000)
                .setDescription("No target channel set.");
            msg.channel.send(embed);
            return;
        }

        if (shouldForward) {
            await forwardMessage(msg, toChannels, acceptUsers);
            wakeUp(data.client);
        }
    };
}

const wakeUp = (() => {
    let timeout: NodeJS.Timeout;
    
    return (client: Client): void => {
        const picsDir = Utilz.picsDir;
        const awakeBotchii  = fs.readFileSync(path.join(picsDir, "botchii-awake.png"));
        const asleepBotchii = fs.readFileSync(path.join(picsDir, "botchii-asleep.png"));

        if (timeout) clearTimeout(timeout);

        client.user?.setAvatar(awakeBotchii)
            .then(() => setTimeout(() => client.user?.setAvatar(asleepBotchii), 4 * HOUR));
    };
})();

async function forwardMessage(msg: Message, toChannels: string[], acceptUsers: User[]) {
    const forwardTitle = `**${msg.member?.nickname ?? msg.author.username + " made an announcement"}:**`;
    const forwardContent = msg.content.replace(/@here/g, "`@`here").replace(/@everyone/g, "`@`everyone");
    const forwardAttachments = msg.attachments.array();
    const forwardEmbeds = msg.embeds;

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
    /*
    const reactedUserIDs: Set<Snowflake> = new Set([]);

    const result = emojis.map(emoji => {
        emoji.users.forEach(user => {
            if (reactedUserIDs.has(user.id)) {
                emoji.count--;
                emoji.users = emoji.users.filter(x => x.id === user.id);
            }
            reactedUserIDs.add(user.id);
        });
        return emoji;
    });

    return result;
    */
    // ^^ imperative code doing the exact same thing ^^

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

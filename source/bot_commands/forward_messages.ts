import * as CoreTools from "../_core/core_tools";
import * as types from "../_core/types";
import { Client, DMChannel, Message, MessageReaction, PartialUser, User } from "discord.js";
import fs from "fs";
import path from "path";
import * as Utilz from "../utilz";
import { ChannelData } from "./set_channel"
// import emojiRegex from "emoji-regex/RGI_Emoji";

const CHANNEL_PREFS_FILE = "channel.json";
const EMOJI_PREFS_FILE = "emojis.json";
const HOUR = 3600000;

const acceptSign     = "✅";
const rejectSign     = "❎";
const announcedEmoji = "👌";
const scoreToForward = 3;               // the message needs to have this much more accepts than rejects

const truncateQuickReplyMsgTo = 40;     // this is how many characters the vote feeback "message quote" gets truncated to

const acceptEmojis  = [ "✅", "☑️", "👍"];
const rejectEmojis  = [ "❎", "❌", "👎", "✖️", "🇽"];
const trackedEmojis = [ ...acceptEmojis, ...rejectEmojis ];

const cmd: types.Command = {
    name: "reactions",
    func: cmdChangeEmoji,
    // adminCommand: true,
    // usage: "reaction [<accept|reject> <emojis...>]",
    // description: "",
    // examples: [ "" ],
    setupFunc: setup
};

async function setup(data: types.Data) {
    const channelData: ChannelData = CoreTools.loadPrefs(CHANNEL_PREFS_FILE);
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

        const isTrackedReaction = trackedEmojis.includes(reaction.emoji.name);
        if (!isTrackedReaction) return;

        const msg = reaction.message;
        if (msg.channel instanceof DMChannel) return;
        const guildID = msg.guild!.id;

        const channelData: ChannelData = CoreTools.loadPrefs(CHANNEL_PREFS_FILE);
        
        const fromChannels = channelData[guildID]?.fromChannels;
        const toChannels = channelData[guildID]?.toChannels;
        const reactions = Array.from(msg.reactions.cache.values());

        if (!fromChannels?.includes(msg.channel.id)) return;

        // cache users for later use
        for (const reaction of reactions) {
            await reaction.users.fetch();
        }

        // has to happen after caching the users
        if (isAlreadyAnnounced(msg)) return;

        const rawCountedEmojis = reactions.map(reaction => Utilz.convertToCountedEmoji(reaction))
                                          .filter(x => !x.isInvalid);

        const trueEmojis = removeDuplicateUserReactions(rawCountedEmojis);

        // console.log(rawCountedEmojis, trueEmojis);

        const emojiAccepts = trueEmojis.filter(x => acceptEmojis.includes(x.string));
        const emojiRejects = trueEmojis.filter(x => rejectEmojis.includes(x.string));
        
        const acceptCount = countEmojis(emojiAccepts);
        const rejectCount = countEmojis(emojiRejects);

        const score = acceptCount - rejectCount;
        const shouldForward = score >= scoreToForward; // && isReactionAdd;

        console.log(rawCountedEmojis.map(({string, count}) => `${string} : ${count}`));
        console.log(`[ ${acceptSign} ${acceptCount}   -   ${rejectCount} ${rejectSign} ]`);

        const truncatedContent = (msg.content.length > truncateQuickReplyMsgTo
            ? msg.content.substr(0, truncateQuickReplyMsgTo) + "..."
            : msg.content);
        const messageReference = (msg.content ? "> " + truncatedContent : CoreTools.getMessageLink(msg))

        const reply = messageReference + "\n"
            + `${acceptSign}\` ${acceptCount}  :  ${rejectCount} \`${rejectSign}    **${scoreToForward-score} to go**`;
        msg.channel.send(reply);

        if (toChannels === undefined || toChannels.length === 0) {
            const embed = CoreTools.createEmbed("error", "No target channel set.");
            msg.channel.send(embed);
            return;
        }

        if (shouldForward) {
            const acceptUsers = emojiAccepts.map(emoji => emoji.users).flat();
            await forwardMessage(msg, toChannels, acceptUsers);
            wakeUp(data.client);
        }
    };
}

const wakeUp = (() => {
    let timeout: NodeJS.Timeout;
    
    return (client: Client): void => {
        const picsDir = CoreTools.PICS_DIR;
        const awakeBotchii  = fs.readFileSync(path.join(picsDir, "botchii-awake.png"));
        const asleepBotchii = fs.readFileSync(path.join(picsDir, "botchii-asleep.png"));

        if (timeout) {
            clearTimeout(timeout)
            timeout = setTimeout(() => client.user!.setAvatar(asleepBotchii), 4 * HOUR);
        };

        client.user!.setAvatar(awakeBotchii)
        .then(() => {
            timeout = setTimeout(() => client.user!.setAvatar(asleepBotchii), 4 * HOUR)
        });
    };
})();

async function forwardMessage(msg: Message, toChannels: string[], acceptUsers: User[]) {
    const member = msg.member;
    const displayName = member?.nickname ?? msg.author.username;
    const acceptUserNames = acceptUsers.map(x => msg.guild!.member(x)?.nickname ?? x.username).join(", ");
    const forwardTitle = "**" + (member ? displayName + " made an announcement" : displayName) + ":**" + ` (accepted by ${acceptUserNames})`;
    const forwardContent = msg.content.replace(/@here/g, "`@`here").replace(/@everyone/g, "`@`everyone");
    const forwardAttachments = Array.from(msg.attachments.values());
    const forwardEmbeds = msg.embeds;

    for (const channelID of toChannels) {
        await msg.client.channels.fetch(channelID).then((channel: any) => {
            channel.send(
                forwardTitle + "\n" + forwardContent,
                ...forwardEmbeds,
                ...forwardAttachments)
        }).catch(console.error);
    }
    
    msg.react(announcedEmoji);
    
    const embed = CoreTools.createEmbed("ok", {
        title: "Made an announcement!",
        desc:  `On behalf of: ${acceptUserNames}`
    })
    msg.channel.send(embed);
}

function isAlreadyAnnounced(message: Message) {
    const reactions = Array.from(message.reactions.cache.values());
    return reactions.some(reaction => {
        const users = Array.from(reaction.users.cache.values());
        const isAnnouncementEmoji = reaction.emoji.name === announcedEmoji;
        const botSentThis         = () => users.some(usr => usr.equals(usr.client.user!));
        return isAnnouncementEmoji && botSentThis();
    });
}

function removeDuplicateUserReactions(emojis: types.CountedEmoji[]) {
    const reactedUsers = new Set<User>();
    return emojis.map(({isCustom, users, string, isInvalid}): types.CountedEmoji => {
        const trueUsers = users.filter(user => {
            const alreadyReacted = reactedUsers.has(user);
            reactedUsers.add(user);
            return !alreadyReacted;
        });
        return {
            isCustom,
            string,
            count: trueUsers.length,
            users: trueUsers,
            isInvalid: isInvalid || trueUsers.length === 0
        };
    }).filter(x => !x.isInvalid);
}

function countEmojis(emojis: types.CountedEmoji[]) {
    return emojis.reduce((acc, emoji) => acc + emoji.count, 0);
}

async function cacheMessages(client: Client, channelData: ChannelData) {
    console.log("caching messages...");
    
    for (const [guildID, guildData] of Object.entries(channelData)) {
        if (guildData.fromChannels?.length) {
            const channelCount = await CoreTools.cacheChannelMessages(client, guildData.fromChannels);
            console.log(`successfully cached ${channelCount} messages in '${guildData.readableGuildName}'`);
        }
    }

    console.log("finished caching messages!");
}

module.exports = cmd;

import * as BotUtils from "../../_core/bot_utils";
import { CoreData, Prefs, GuildPrefs } from "../../_core/types";
import * as Utilz from "../../utilz";
import { AnnounceData, ANNOUNCE_PREFS_FILE, ChannelData, CHANNEL_PREFS_FILE, EXPIRED_MESSAGE_TEXT } from "../command_prefs";
import { Client, DMChannel, Message, MessageReaction, NewsChannel, PartialUser, TextChannel, User } from "discord.js";
import { UserReactions } from "../../custom_types";

export const announcedEmoji  = "👌";
export const acceptEmoji     = "⬆️"
export const rejectEmoji     = "⬇️"
export const scoreToForward  = 3;
export const invalidateFor = 72;  // hours passed

export async function setup(coreData: CoreData) {
    await removeExpiredTrackers(coreData.client);
    setInterval(() => removeExpiredTrackers(coreData.client), 1000*60*60);     // every hour
    // setInterval(() => removeExpiredTrackers(coreData.client), 1000);     // every second
    
    const announcedPrefs = BotUtils.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE);
    const trackerMsgLinks = Object.values(announcedPrefs).map(x => Object.values(x.announceMessages).map(x => x.trackerMsgLink)).flat(1);

    const cachedMessages = await BotUtils.cacheMessages(coreData.client, trackerMsgLinks);
    console.log(`cached '${cachedMessages.length}' announcement tracker messages`);

    // check tracker messages, in case they changed while the bot was offline
    cachedMessages.forEach(msg => {
        const firstReaction = msg.reactions.cache.first();
        if (firstReaction === undefined) return;
        trackReactions(coreData, false)(firstReaction, undefined);
    });

    coreData.client.on("messageReactionAdd",    trackReactions(coreData, true));
    coreData.client.on("messageReactionRemove", trackReactions(coreData, false));

}

async function removeExpiredTrackers(client: Client) {
    const currentTimestamp = Date.now();
    const invalidateForMsPassed = invalidateFor*60*60*1000;
    const invalidateBefore = currentTimestamp - invalidateForMsPassed;

    let announcedPrefs = BotUtils.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true);
    let msgEditPromises: Promise<Message | void>[] = [];

    for (const [guildID, announceData] of Object.entries(announcedPrefs)) {
        for (const [announceMsgLink, { createdTimestamp, trackerMsgLink }] of Object.entries(announceData.announceMessages)) {
            const shouldDelete = createdTimestamp <= invalidateBefore;
            if (!shouldDelete) continue;

            try {
                const trackerMsg = await BotUtils.fetchMessageLink(client, trackerMsgLink);
                delete announcedPrefs[guildID]!.announceMessages[announceMsgLink];
                console.log(`deleted an announcement tracker in '${announcedPrefs[guildID]!.guildName}'`);
                const editPromise = trackerMsg?.edit(EXPIRED_MESSAGE_TEXT)?.catch(err => console.warn(err));
                if (editPromise !== undefined) msgEditPromises.push(editPromise);
            }
            catch (err) {
                continue;
            }
        }
    }

    for (const promise of msgEditPromises) {
        await promise;
    }
    
    BotUtils.updatePrefs(ANNOUNCE_PREFS_FILE, announcedPrefs, true);
}

function trackReactions(coreData: CoreData, isAdd: boolean) {
    // user is undefined, if it's simulated
    return async (reaction: MessageReaction, user: User | PartialUser | undefined) => {
        if (user?.bot) return;
        // return if PartialUser
        if (!(user instanceof User || user === undefined)) return;
        
        const message = reaction.message;
        const announceData = BotUtils.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true)[message.guild!.id];
        if (announceData === undefined) return;
        const newAnnData = getCurrentAnnounceData(announceData, message);
        if (newAnnData === undefined) return;
        const { announceMsgLink, trackerMsgLink, targetChannels: customTargetChannels } = newAnnData;

        const targetChannelIDs = customTargetChannels ?? BotUtils.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[message.guild!.id]?.toChannels;

        if (targetChannelIDs === undefined) {
            BotUtils.sendEmbed(message, "error", {
                title: "No target channels are given!",
                desc:  `Type \`${BotUtils.getPrefix(message.guild!.id)}channel\` to see the default target channels.`
            });
            return;
        }

        const userReactions = await getUserReactions(message);
        const trackerMsg  = (await BotUtils.fetchMessageLink(coreData.client, trackerMsgLink))!;
        const announceMsg = (await BotUtils.fetchMessageLink(coreData.client, announceMsgLink))!;
        const { shouldForward, content } = getContentAndShouldForward(userReactions, announceMsg, targetChannelIDs);

        if (shouldForward) {
            const targetChannels = await BotUtils.fetchChannels(message.client, targetChannelIDs);
            const targetTextChannels = targetChannels.filter(Utilz.isTextChannel);
            await forwardMessage(announceMsg, targetTextChannels);
            invalidateAnnounceMsg(announceMsg, announceData);
        }
    
        await trackerMsg.edit(content);

        if (!isAdd) return;

        if (user === undefined) return;
        const member = message.guild!.member(user);
        const username = member?.nickname ?? user.username;
        message.channel.send(`**${username}** just voted!`).then(sentMsg => {
            setTimeout(() => sentMsg.delete(), 1000*30);
        });
    }
}

function getCurrentAnnounceData(announceData: AnnounceData, message: Message) {
    const newAnnData = Object.entries(announceData.announceMessages)
    .map(([announceMsgLink, { trackerMsgLink, targetChannels }]) => { return { announceMsgLink, trackerMsgLink, targetChannels } });
    
    return newAnnData.find(({ trackerMsgLink }) => BotUtils.getMessageLink(message) === trackerMsgLink);
}

async function getUserReactions(message: Message) {
    const reactions = Array.from(message.reactions.cache.values());
    let userReactions = await Utilz.convertToUserReactions(reactions);
    delete userReactions[message.client.user!.id];
    return userReactions;
}

function getUserIDs(userReactions: UserReactions) {
    const acceptUserIDs = new Set(Object.entries(userReactions).filter(([,emojiStr]) => emojiStr.has(acceptEmoji)).map(([userID]) => userID));
    const rejectUserIDs = Utilz.difference(
        new Set(Object.entries(userReactions).filter(([,emojiStr]) => emojiStr.has(rejectEmoji)).map(([userID]) => userID)),
        acceptUserIDs
    );
    return { acceptUserIDs, rejectUserIDs };
}

function getScoreToGo(acceptUserIDs: Set<string>, rejectUserIDs: Set<string>) {
    const score     = acceptUserIDs.size - rejectUserIDs.size;
    const scoreToGo = Math.max(scoreToForward - score, 0);
    return scoreToGo
}

function getPendingContentParts(announceMsg: Message, targetChannelIDs: Set<string> | string[], scoreToGo: number) {
    const announceMsgLink = BotUtils.getMessageLink(announceMsg);
    const announceMsgQuote   = (announceMsg.content ? BotUtils.quoteMessage(announceMsg, 75) : "");
    const targetChArray        = [...targetChannelIDs];
    const targetChannelStrings = "**to:** " + targetChArray.map(x => "<#"+x+">").join(", ");
    const scoreToGoString      = `**${scoreToGo} to go**`;
    return { announceMsgQuote, announceMsgLink, targetChannelStrings, scoreToGoString };
}

function getAnnouncedContentParts(announceMsg: Message, targetChannelIDs: Set<string> | string[], acceptUserIDs: Set<string>) {
    const announceUserStrings  = `**-- Announced by ${[...acceptUserIDs].map(x => "<@"+x+">").join(", ")} --**`;
    return { announceUserStrings, ...getPendingContentParts(announceMsg, targetChannelIDs, 0) };
}

function getContentString(parts: ReturnType<typeof getPendingContentParts> | ReturnType<typeof getAnnouncedContentParts>): string {
    const { announceMsgLink, announceMsgQuote, targetChannelStrings, scoreToGoString } = parts;
    if ("announceUserStrings" in parts) {
        const { announceUserStrings } = parts;
        return [ announceMsgLink, announceMsgQuote, "", targetChannelStrings, announceUserStrings ].join("\n");
    } else {
        return [ announceMsgLink, announceMsgQuote, "", targetChannelStrings, scoreToGoString ].join("\n");
    }
}

function getContentAndShouldForward(userReactions: UserReactions, announceMsg: Message, targetChannelIDs: Set<string> | string[]) {
    const { acceptUserIDs, rejectUserIDs } = getUserIDs(userReactions);
    const scoreToGo = getScoreToGo(acceptUserIDs, rejectUserIDs);
    const shouldForward = scoreToGo <= 0;
    const content = (shouldForward
        ? getContentString(getAnnouncedContentParts(announceMsg, targetChannelIDs, acceptUserIDs))
        : getContentString(getPendingContentParts(announceMsg, targetChannelIDs, scoreToGo))
    );
    return { shouldForward, content };
}

function invalidateAnnounceMsg(announceMsg: Message, announceData: AnnounceData) {
    const guild = announceMsg.guild
    const announceMsgLink = BotUtils.getMessageLink(announceMsg);
    delete announceData.announceMessages[announceMsgLink];
    const newAnnouncePrefs: Prefs<AnnounceData> = {
        [guild!.id]: { ...announceData, guildName: guild!.name }
    }
    BotUtils.updatePrefs(ANNOUNCE_PREFS_FILE, newAnnouncePrefs);
}

async function forwardMessage(announceMsg: Message, targetChannels: Array<TextChannel | NewsChannel | DMChannel>) {
    const announcerName = announceMsg.member?.nickname ?? announceMsg.author.username;
    const title         = (!!announceMsg.member /* && !announceMsg.system */
                          ? `__**${announcerName}** made an announcement__`
                          : `__**${announcerName}**__`) + ":";
    const content       = announceMsg.content.replace(/@here/g, "`@`here").replace(/@everyone/g, "`@`everyone");
    const attachments   = Array.from(announceMsg.attachments.values());
    const embeds        = announceMsg.embeds;
    const timestamp     = announceMsg.createdTimestamp;

    const msgPromises = targetChannels.map(ch => ch.send(title + "\n" + content, [...attachments, ...embeds]));

    for (const msgPromise of msgPromises) {
        const msg = await msgPromise;
        // msg.suppressEmbeds(false);
    };
}

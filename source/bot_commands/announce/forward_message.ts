import * as Utilz from "../../utilz";
import { loadPrefs, cacheMessages, fetchMessageLink, updatePrefs, sendEmbed, getPrefix, fetchChannels, getMessageLink, CoreData, Prefs, notOf, addListener, isMessageChannel } from "../../_core/bot_core";
import { AnnounceData, ANNOUNCE_PREFS_FILE, ChannelData, CHANNEL_PREFS_FILE, EXPIRED_MESSAGE_TEXT } from "../command_prefs";
import { Client, DMChannel, Guild, Message, MessageReaction, NewsChannel, PartialUser, TextChannel, User } from "discord.js";
import { getContentAndShouldForward } from "./announce_tracker";

export const announcedEmoji  = "👌";
export const acceptEmoji     = "⬆️"
export const rejectEmoji     = "⬇️"
export const scoreToForward  = 3;
export const invalidateFor = 72;  // hours passed

export async function setup({ client }: CoreData) {
    await removeExpiredTrackers(client);
    setInterval(() => removeExpiredTrackers(client), 1000*60*60);     // every hour
    // setInterval(() => removeExpiredTrackers(client), 1000);     // every second
    
    const announcedPrefs = loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE);
    const trackerMsgLinks = Object.values(announcedPrefs).map(x => Object.values(x.announceMessages).map(x => x.trackerMsgLink)).flat(1);

    const cachedMessages = await cacheMessages(client, trackerMsgLinks);
    console.log(`cached '${cachedMessages.length}' announcement tracker messages`);

    // check tracker messages, in case they changed while the bot was offline
    cachedMessages.forEach(msg => {
        const firstReaction = msg.reactions.cache.first();
        if (firstReaction === undefined) return;
        trackReactions(client, false)(firstReaction, undefined);
    });

    addListener(client, "messageReactionAdd",    trackReactions(client, true));
    addListener(client, "messageReactionRemove", trackReactions(client, false));

}

async function removeExpiredTrackers(client: Client) {
    const currentTimestamp = Date.now();
    const invalidateForMsPassed = invalidateFor*60*60*1000;
    const invalidateBefore = currentTimestamp - invalidateForMsPassed;

    let announcedPrefs = loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true);
    
    const editPromises = Object.entries(announcedPrefs).map(([guildID, announceData]) => {
        return Object.entries(announceData.announceMessages).map(([announceMsgLink, { createdTimestamp, trackerMsgLink }]) => {
            const shouldDelete = createdTimestamp <= invalidateBefore;
            if (!shouldDelete) return undefined;
            delete announcedPrefs[guildID]!.announceMessages[announceMsgLink];
            console.log(`deleted an announcement tracker in '${announcedPrefs[guildID]!.guildName}'`);
            
            return (async() => {
                const trackerMsg = await fetchMessageLink(client, trackerMsgLink);
                const editPromise = trackerMsg?.edit(EXPIRED_MESSAGE_TEXT);
                editPromise?.catch(console.error);
                return await editPromise;
            })();
        });
    }).flat().filter(notOf(undefined));
    
    await Promise.allSettled(editPromises);
    
    updatePrefs(ANNOUNCE_PREFS_FILE, announcedPrefs, true);
}

function trackReactions(client: Client, isAdd: boolean) {
    // user is undefined, if it's simulated
    return async (reaction: MessageReaction, user: User | PartialUser | undefined) => {
        if (user?.bot) return;
        // return if PartialUser
        if (!(user instanceof User || user === undefined)) return;
        
        const message = reaction.message;
        const announceData = loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true)[message.guild!.id];
        if (announceData === undefined) return;
        const newAnnData = getCurrentAnnounceData(announceData, message);
        if (newAnnData === undefined) return;
        const { announceMsgLink, trackerMsgLink, targetChannels: customTargetChannels } = newAnnData;

        const targetChannelIDs = customTargetChannels ?? loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[message.guild!.id]?.toChannels;

        if (targetChannelIDs === undefined) {
            sendEmbed(message, "error", {
                title: "No target channels are given!",
                desc:  `Type \`${getPrefix(message.guild!.id)}channel\` to see the default target channels.`
            });
            return;
        }

        const userReactions = await getUserReactions(message);
        const trackerMsg  = (await fetchMessageLink(client, trackerMsgLink))!;
        const announceMsg = (await fetchMessageLink(client, announceMsgLink));
        const { shouldForward, content } = getContentAndShouldForward(userReactions, announceMsg, targetChannelIDs);

        if (shouldForward || announceMsg === undefined) {
            invalidateAnnounceMsg(message.guild!, announceMsgLink, announceData);
            
            if (announceMsg !== undefined) {
                const targetChannels = await fetchChannels(message.client, targetChannelIDs);
                const targetTextChannels = targetChannels.filter(isMessageChannel);
                await forwardMessage(announceMsg, targetTextChannels);
            }
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
    
    return newAnnData.find(({ trackerMsgLink }) => getMessageLink(message) === trackerMsgLink);
}

async function getUserReactions(message: Message) {
    const reactions = Array.from(message.reactions.cache.values());
    let userReactions = await Utilz.convertToUserReactions(reactions);
    delete userReactions[message.client.user!.id];
    return userReactions;
}

function invalidateAnnounceMsg(guild: Guild, announceMsgLink: string, announceData: AnnounceData) {
    delete announceData.announceMessages[announceMsgLink];
    const newAnnouncePrefs: Prefs<AnnounceData> = {
        [guild!.id]: { ...announceData, guildName: guild!.name }
    }
    updatePrefs(ANNOUNCE_PREFS_FILE, newAnnouncePrefs);
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

    await Promise.allSettled(msgPromises);
}

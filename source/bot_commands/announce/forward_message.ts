import * as CoreTools from "../../_core/core_tools";
import * as types from "../../_core/types";
import * as Utilz from "../../utilz";
import { AnnounceData, ANNOUNCE_PREFS_FILE, ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";
import { Client, DMChannel, Message, MessageReaction, NewsChannel, PartialUser, TextChannel, User } from "discord.js";

export const announcedEmoji  = "👌";
export const acceptEmoji     = "⬆️"
export const rejectEmoji     = "⬇️"
export const scoreToForward  = 3;
export const invalidateAfter = 72; // hours passed

export async function setup(data: types.Data) {
    removeExpiredTrackers();
    setInterval(removeExpiredTrackers, 1000*60*60*6);
    
    const announcedPrefs = CoreTools.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE);
    const trackerMsgLinks = Object.values(announcedPrefs).map(x => Object.values(x!.announceMessages).map(x => x.trackerMsgLink)).flat(1);
    const cachedMessageCount = await CoreTools.cacheMessages(data.client, trackerMsgLinks);
    console.log(`cached ${cachedMessageCount} announcement tracker messages`);

    data.client.on("messageReactionAdd",    trackReactions(data));
    data.client.on("messageReactionRemove", trackReactions(data));

}

function removeExpiredTrackers() {
    const currentTimestamp = Date.now();
    const invalidateAfterMsPassed = invalidateAfter*60*60*1000;
    const invalidateBefore = currentTimestamp - invalidateAfterMsPassed;
    const announcedPrefs = CoreTools.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true);
    Object.entries(announcedPrefs).forEach(([guildID, announceData]) => {
        Object.entries(announceData!.announceMessages)
        .forEach(([announceMsgLink, { createdTimestamp }]) => {
            if (createdTimestamp < invalidateBefore) {
                delete announcedPrefs[guildID]!.announceMessages[announceMsgLink];
            }
        });
    });
    CoreTools.updatePrefs(ANNOUNCE_PREFS_FILE, announcedPrefs);
}

function trackReactions(data: types.Data) {
    return async (reaction: MessageReaction, user: User | PartialUser) => {
        if (user.bot) return;
        const message = reaction.message;
        if (!(user instanceof User)) return;
        const announceData = CoreTools.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE)[message.guild!.id];
        if (!announceData) return;

        const newAnnData = Object.entries(announceData.announceMessages)
            .map(([announceMsgLink, { trackerMsgLink, targetChannels }]) => { return { announceMsgLink, trackerMsgLink, targetChannels } })
        const trackedMsgData = newAnnData.find(({ trackerMsgLink }) => CoreTools.getMessageLink(message) === trackerMsgLink);
        if (!trackedMsgData) return;
        const { announceMsgLink, trackerMsgLink, targetChannels: customTargetChannels } = trackedMsgData;

        const targetChannelIDs = customTargetChannels ?? CoreTools.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[message.guild!.id]?.toChannels;

        if (!targetChannelIDs) {
            CoreTools.sendEmbed(message, "error", {
                title: "No target channels are given!",
                desc:  "Type \`.channel\` to see the default target channels."
            });
            return;
        }

        const reactions = Array.from(message.reactions.cache.values());
        const userReactions = await Utilz.convertToUserReactions(reactions);
        delete userReactions[data.client.user!.id];

        const acceptUserIDs = new Set(Object.entries(userReactions).filter(([,emojiStr]) => emojiStr.has(acceptEmoji)).map(([userID]) => userID));
        const rejectUserIDs = Utilz.difference(
            new Set(Object.entries(userReactions).filter(([,emojiStr]) => emojiStr.has(rejectEmoji)).map(([userID]) => userID)),
            acceptUserIDs
        );

        const score         = acceptUserIDs.size - rejectUserIDs.size;
        const scoreToGo     = Math.max(scoreToForward - score, 0);
        const shouldForward = scoreToGo === 0;

        const trackerMsg  = (await CoreTools.fetchMessageLink(data.client, trackerMsgLink))!;
        const announceMsg = (await CoreTools.fetchMessageLink(data.client, announceMsgLink))!;
        const content = announceMsgLink
            + (announceMsg.content ? "\n" + CoreTools.quoteMessage(announceMsg, 75) : "") + "\n"
            + (targetChannelIDs.length ? "\n**to:** " + targetChannelIDs.map(x => "<#"+x+">").join(", ") : "")
            + "\n" + (shouldForward ? `**-- Announced by ${[...acceptUserIDs].map(x => "<@"+x+">").join(", ")} --**` : `**${scoreToGo} to go**`);
        
        await trackerMsg.edit(content);

        if (shouldForward) {
            const targetChannels = (await CoreTools.fetchChannels(data.client, targetChannelIDs ?? []))
                .filter((x): x is TextChannel | NewsChannel | DMChannel => Utilz.isTextChannel(x));
            await forwardMessage(announceMsg, targetChannels);

            const newAnnounceData = {
                [message.guild!.id]: {
                    guildName: message.guild!.name,
                    announceMessages: { ...announceData.announceMessages, [announceMsgLink]: undefined }
                }
            } as types.Prefs<AnnounceData>;
            CoreTools.updatePrefs(ANNOUNCE_PREFS_FILE, newAnnounceData);
        }
    }
}

async function forwardMessage(announceMsg: Message, targetChannels: Array<TextChannel | NewsChannel | DMChannel>) {
    const announcerName = announceMsg.member?.nickname ?? announceMsg.author.username;
    const title         = "__" + (announceMsg.member ? `**${announcerName}** made an announcement` : announcerName) + "__:"
    const content       = announceMsg.content.replace(/@here/g, "`@`here").replace(/@everyone/g, "`@`everyone");
    const attachments   = Array.from(announceMsg.attachments.values());
    const embeds        = announceMsg.embeds;
    const timestamp     = announceMsg.createdTimestamp;

    const msgPromises = targetChannels.map(ch => ch.send(title + "\n" + content, [...attachments, ...embeds]));

    for (const msgPromise of msgPromises) {
        const msg = await msgPromise;
        msg.suppressEmbeds(false);
    };
}

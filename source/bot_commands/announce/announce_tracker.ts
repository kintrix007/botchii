import * as Utilz from "../../utilz";
import { Message } from "discord.js";
import { UserReactions } from "../../custom_types";
import { getMessageLink, quoteMessage } from "../../_core/bot_core";
import { acceptEmoji, rejectEmoji, scoreToForward } from "./forward_message";

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

function getPendingContentParts(announceMsg: Message | undefined, targetChannelIDs: Set<string> | string[], scoreToGo: number) {
    const announceMsgLink = announceMsg ? getMessageLink(announceMsg) : undefined;
    const announceMsgQuote   = (announceMsg?.content ? quoteMessage(announceMsg.content, 75) : undefined);
    const targetChArray        = [...targetChannelIDs];
    const targetChannelStrings = "**to:** " + targetChArray.map(x => "<#"+x+">").join(", ");
    const scoreToGoString      = `**${scoreToGo} to go**`;
    return { announceMsgQuote, announceMsgLink, targetChannelStrings, scoreToGoString };
}

function getAnnouncedContentParts(announceMsg: Message | undefined, targetChannelIDs: Set<string> | string[], acceptUserIDs: Set<string>) {
    const announceUserStrings  = `**-- Announced by ${[...acceptUserIDs].map(x => "<@"+x+">").join(", ")} --**`;
    return { announceUserStrings, ...getPendingContentParts(announceMsg, targetChannelIDs, 0) };
}

function getContentString(parts: ReturnType<typeof getPendingContentParts> | ReturnType<typeof getAnnouncedContentParts>): string {
    const { announceMsgLink, announceMsgQuote, targetChannelStrings, scoreToGoString } = parts;
    let content = "";

    if (announceMsgLink !== undefined)  content += announceMsgLink + "\n";
    else                                content += "*Message deleted*" + "\n";
    if (announceMsgQuote !== undefined) content += announceMsgQuote + "\n";
    content += targetChannelStrings + "\n";
    content += "\n";
    
    if ("announceUserStrings" in parts) {
        const { announceUserStrings } = parts;
        content += announceUserStrings;
        return content;
    } else {
        content += scoreToGoString;
        return content;
    }
}

export function getContentAndShouldForward(userReactions: UserReactions, announceMsg: Message | undefined, targetChannelIDs: Set<string> | string[]) {
    const { acceptUserIDs, rejectUserIDs } = getUserIDs(userReactions);
    const scoreToGo = getScoreToGo(acceptUserIDs, rejectUserIDs);
    const shouldForward = scoreToGo <= 0;
    const content = (shouldForward
        ? getContentString(getAnnouncedContentParts(announceMsg, targetChannelIDs, acceptUserIDs))
        : getContentString(getPendingContentParts(announceMsg, targetChannelIDs, scoreToGo))
    );
    return { shouldForward, content };
}
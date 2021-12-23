"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentAndShouldForward = void 0;
const Utilz = __importStar(require("../../utilz"));
const bot_core_1 = require("../../_core/bot_core");
const forward_message_1 = require("./forward_message");
function getUserIDs(userReactions) {
    const acceptUserIDs = new Set(Object.entries(userReactions).filter(([, emojiStr]) => emojiStr.has(forward_message_1.acceptEmoji)).map(([userID]) => userID));
    const rejectUserIDs = Utilz.difference(new Set(Object.entries(userReactions).filter(([, emojiStr]) => emojiStr.has(forward_message_1.rejectEmoji)).map(([userID]) => userID)), acceptUserIDs);
    return { acceptUserIDs, rejectUserIDs };
}
function getScoreToGo(acceptUserIDs, rejectUserIDs) {
    const score = acceptUserIDs.size - rejectUserIDs.size;
    const scoreToGo = Math.max(forward_message_1.scoreToForward - score, 0);
    return scoreToGo;
}
function getPendingContentParts(announceMsg, targetChannelIDs, scoreToGo) {
    const announceMsgLink = announceMsg ? bot_core_1.getMessageLink(announceMsg) : undefined;
    const announceMsgQuote = ((announceMsg === null || announceMsg === void 0 ? void 0 : announceMsg.content) ? bot_core_1.quoteMessage(announceMsg.content, 75) : undefined);
    const targetChArray = [...targetChannelIDs];
    const targetChannelStrings = "**to:** " + targetChArray.map(x => "<#" + x + ">").join(", ");
    const scoreToGoString = `**${scoreToGo} to go**`;
    return { announceMsgQuote, announceMsgLink, targetChannelStrings, scoreToGoString };
}
function getAnnouncedContentParts(announceMsg, targetChannelIDs, acceptUserIDs) {
    const announceUserStrings = `**-- Announced by ${[...acceptUserIDs].map(x => "<@" + x + ">").join(", ")} --**`;
    return Object.assign({ announceUserStrings }, getPendingContentParts(announceMsg, targetChannelIDs, 0));
}
function getContentString(parts) {
    const { announceMsgLink, announceMsgQuote, targetChannelStrings, scoreToGoString } = parts;
    let content = "";
    if (announceMsgLink !== undefined)
        content += announceMsgLink + "\n";
    else
        content += "*Message deleted*" + "\n";
    if (announceMsgQuote !== undefined)
        content += announceMsgQuote + "\n";
    content += targetChannelStrings + "\n";
    content += "\n";
    if ("announceUserStrings" in parts) {
        const { announceUserStrings } = parts;
        content += announceUserStrings;
        return content;
    }
    else {
        content += scoreToGoString;
        return content;
    }
}
function getContentAndShouldForward(userReactions, announceMsg, targetChannelIDs) {
    const { acceptUserIDs, rejectUserIDs } = getUserIDs(userReactions);
    const scoreToGo = getScoreToGo(acceptUserIDs, rejectUserIDs);
    const shouldForward = scoreToGo <= 0;
    const content = (shouldForward
        ? getContentString(getAnnouncedContentParts(announceMsg, targetChannelIDs, acceptUserIDs))
        : getContentString(getPendingContentParts(announceMsg, targetChannelIDs, scoreToGo)));
    return { shouldForward, content };
}
exports.getContentAndShouldForward = getContentAndShouldForward;

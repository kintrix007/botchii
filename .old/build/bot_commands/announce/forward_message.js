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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = exports.invalidateFor = exports.scoreToForward = exports.rejectEmoji = exports.acceptEmoji = exports.announcedEmoji = void 0;
const Utilz = __importStar(require("../../utilz"));
const bot_core_1 = require("../../_core/bot_core");
const command_prefs_1 = require("../command_prefs");
const discord_js_1 = require("discord.js");
const announce_tracker_1 = require("./announce_tracker");
exports.announcedEmoji = "👌";
exports.acceptEmoji = "⬆️";
exports.rejectEmoji = "⬇️";
exports.scoreToForward = 3;
exports.invalidateFor = 72; // hours passed
function setup({ client }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield removeExpiredTrackers(client);
        setInterval(() => removeExpiredTrackers(client), 1000 * 60 * 60); // every hour
        // setInterval(() => removeExpiredTrackers(client), 1000);     // every second
        const announcedPrefs = bot_core_1.loadPrefs(command_prefs_1.ANNOUNCE_PREFS_FILE);
        const trackerMsgLinks = Object.values(announcedPrefs).map(x => Object.values(x.announceMessages).map(x => x.trackerMsgLink)).flat(1);
        const cachedMessages = yield bot_core_1.cacheMessages(client, trackerMsgLinks);
        console.log(`cached '${cachedMessages.length}' announcement tracker messages`);
        // check tracker messages, in case they changed while the bot was offline
        cachedMessages.forEach(msg => {
            const firstReaction = msg.reactions.cache.first();
            if (firstReaction === undefined)
                return;
            trackReactions(client, false)(firstReaction, undefined);
        });
        bot_core_1.addListener(client, "messageReactionAdd", trackReactions(client, true));
        bot_core_1.addListener(client, "messageReactionRemove", trackReactions(client, false));
    });
}
exports.setup = setup;
function removeExpiredTrackers(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentTimestamp = Date.now();
        const invalidateForMsPassed = exports.invalidateFor * 60 * 60 * 1000;
        const invalidateBefore = currentTimestamp - invalidateForMsPassed;
        let announcedPrefs = bot_core_1.loadPrefs(command_prefs_1.ANNOUNCE_PREFS_FILE, true);
        const editPromises = Object.entries(announcedPrefs).map(([guildID, announceData]) => {
            return Object.entries(announceData.announceMessages).map(([announceMsgLink, { createdTimestamp, trackerMsgLink }]) => {
                const shouldDelete = createdTimestamp <= invalidateBefore;
                if (!shouldDelete)
                    return undefined;
                delete announcedPrefs[guildID].announceMessages[announceMsgLink];
                console.log(`deleted an announcement tracker in '${announcedPrefs[guildID].guildName}'`);
                return (() => __awaiter(this, void 0, void 0, function* () {
                    const trackerMsg = yield bot_core_1.fetchMessageLink(client, trackerMsgLink);
                    const editPromise = trackerMsg === null || trackerMsg === void 0 ? void 0 : trackerMsg.edit(command_prefs_1.EXPIRED_MESSAGE_TEXT);
                    editPromise === null || editPromise === void 0 ? void 0 : editPromise.catch(console.error);
                    return yield editPromise;
                }))();
            });
        }).flat().filter(bot_core_1.notOf(undefined));
        yield Promise.allSettled(editPromises);
        bot_core_1.updatePrefs(command_prefs_1.ANNOUNCE_PREFS_FILE, announcedPrefs, true);
    });
}
function trackReactions(client, isAdd) {
    // user is undefined, if it's simulated
    return (reaction, user) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (user === null || user === void 0 ? void 0 : user.bot)
            return;
        // return if PartialUser
        if (!(user instanceof discord_js_1.User || user === undefined))
            return;
        const message = reaction.message;
        const announceData = bot_core_1.loadPrefs(command_prefs_1.ANNOUNCE_PREFS_FILE, true)[message.guild.id];
        if (announceData === undefined)
            return;
        const newAnnData = getCurrentAnnounceData(announceData, message);
        if (newAnnData === undefined)
            return;
        const { announceMsgLink, trackerMsgLink, targetChannels: customTargetChannels } = newAnnData;
        const targetChannelIDs = customTargetChannels !== null && customTargetChannels !== void 0 ? customTargetChannels : (_a = bot_core_1.loadPrefs(command_prefs_1.CHANNEL_PREFS_FILE, true)[message.guild.id]) === null || _a === void 0 ? void 0 : _a.toChannels;
        if (targetChannelIDs === undefined) {
            bot_core_1.sendEmbed(message, "error", {
                title: "No target channels are given!",
                desc: `Type \`${bot_core_1.getPrefix(message.guild.id)}channel\` to see the default target channels.`
            });
            return;
        }
        const userReactions = yield getUserReactions(message);
        const trackerMsg = (yield bot_core_1.fetchMessageLink(client, trackerMsgLink));
        const announceMsg = (yield bot_core_1.fetchMessageLink(client, announceMsgLink));
        const { shouldForward, content } = announce_tracker_1.getContentAndShouldForward(userReactions, announceMsg, targetChannelIDs);
        if (shouldForward || announceMsg === undefined) {
            invalidateAnnounceMsg(message.guild, announceMsgLink, announceData);
            if (announceMsg !== undefined) {
                const targetChannels = yield bot_core_1.fetchChannels(message.client, targetChannelIDs);
                const targetTextChannels = targetChannels.filter(bot_core_1.isMessageChannel);
                yield forwardMessage(announceMsg, targetTextChannels);
            }
        }
        yield trackerMsg.edit(content);
        if (!isAdd)
            return;
        if (user === undefined)
            return;
        const member = message.guild.member(user);
        const username = (_b = member === null || member === void 0 ? void 0 : member.nickname) !== null && _b !== void 0 ? _b : user.username;
        message.channel.send(`**${username}** just voted!`).then(sentMsg => {
            setTimeout(() => sentMsg.delete(), 1000 * 30);
        });
    });
}
function getCurrentAnnounceData(announceData, message) {
    const newAnnData = Object.entries(announceData.announceMessages)
        .map(([announceMsgLink, { trackerMsgLink, targetChannels }]) => { return { announceMsgLink, trackerMsgLink, targetChannels }; });
    return newAnnData.find(({ trackerMsgLink }) => bot_core_1.getMessageLink(message) === trackerMsgLink);
}
function getUserReactions(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const reactions = Array.from(message.reactions.cache.values());
        let userReactions = yield Utilz.convertToUserReactions(reactions);
        delete userReactions[message.client.user.id];
        return userReactions;
    });
}
function invalidateAnnounceMsg(guild, announceMsgLink, announceData) {
    delete announceData.announceMessages[announceMsgLink];
    const newAnnouncePrefs = {
        [guild.id]: Object.assign(Object.assign({}, announceData), { guildName: guild.name })
    };
    bot_core_1.updatePrefs(command_prefs_1.ANNOUNCE_PREFS_FILE, newAnnouncePrefs);
}
function forwardMessage(announceMsg, targetChannels) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const announcerName = (_b = (_a = announceMsg.member) === null || _a === void 0 ? void 0 : _a.nickname) !== null && _b !== void 0 ? _b : announceMsg.author.username;
        const title = (!!announceMsg.member /* && !announceMsg.system */
            ? `__**${announcerName}** made an announcement__`
            : `__**${announcerName}**__`) + ":";
        const content = announceMsg.content.replace(/@here/g, "`@`here").replace(/@everyone/g, "`@`everyone");
        const attachments = Array.from(announceMsg.attachments.values());
        const embeds = announceMsg.embeds;
        const timestamp = announceMsg.createdTimestamp;
        const msgPromises = targetChannels.map(ch => ch.send(title + "\n" + content, [...attachments, ...embeds]));
        yield Promise.allSettled(msgPromises);
    });
}

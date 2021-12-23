"use strict";
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
const bot_core_1 = require("../../_core/bot_core");
const command_prefs_1 = require("../command_prefs");
const forward_message_1 = require("./forward_message");
const announce_tracker_1 = require("./announce_tracker");
const description = `Creates an announcement poll for a given message. If accepted it forwards the message to all of the target channels.
You can specify where to announce the message, which can be a channel alias.
When omitted announces to the currently set target channels.
Every announcement message is only valid for 3 days. After this time, it counts as rejected.`;
exports.default = {
    setup: forward_message_1.setup,
    call: cmdAnnounce,
    name: "announce",
    group: "announcement",
    aliases: ["forward"],
    permissions: [bot_core_1.adminPermission],
    usage: "announce <message link> [target channels...]",
    description: description,
    examples: [["https://discord.com/channels/123456789012345678/012345678901234567/234567890123456789"], ["234567890123456789", "#announcements"]]
};
function cmdAnnounce({ msg, args }) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const replyMessage = yield bot_core_1.getReplyMessage(msg);
        const announceMsgLinkOrID = (!!replyMessage ? bot_core_1.getMessageLink(replyMessage) : args[0]);
        const targetChannelAliases = (!!replyMessage ? args.slice(0) : args.slice(1));
        if (!announceMsgLinkOrID) {
            bot_core_1.sendEmbed(msg, "error", "Gib Msseage link .-.");
            return;
        }
        const channelData = bot_core_1.loadPrefs(command_prefs_1.CHANNEL_PREFS_FILE)[msg.guild.id];
        const announceMsg = yield getMessage(msg.channel, announceMsgLinkOrID);
        if (announceMsg === undefined) {
            bot_core_1.sendEmbed(msg, "error", "The message link is either invalid, or points to a message the bot cannot see.");
            return;
        }
        const announceMsgLink = bot_core_1.getMessageLink(announceMsg);
        if (!((_a = channelData === null || channelData === void 0 ? void 0 : channelData.fromChannels) === null || _a === void 0 ? void 0 : _a.includes(announceMsg.channel.id))) {
            bot_core_1.sendEmbed(msg, "error", {
                title: "Can only announce messages from the base channels!",
                desc: `Use the command \`${bot_core_1.getPrefix(msg.guild.id)}channel\` to see the currently set base channels.`
            });
            return;
        }
        const customTargetChannels = bot_core_1.parseChannels(msg.guild, targetChannelAliases);
        const targetChannelIDs = (customTargetChannels.length === 0
            ? (_b = bot_core_1.loadPrefs(command_prefs_1.CHANNEL_PREFS_FILE, true)[msg.guild.id]) === null || _b === void 0 ? void 0 : _b.toChannels
            : customTargetChannels);
        if (targetChannelIDs === undefined) {
            bot_core_1.sendEmbed(msg, "error", {
                title: "No target channels are given!",
                desc: `Use the command \`${bot_core_1.getPrefix(msg.guild.id)}channel\` to see the default target channels.`
            });
            return;
        }
        const { content } = announce_tracker_1.getContentAndShouldForward({}, announceMsg, targetChannelIDs);
        const announcePrefs = bot_core_1.loadPrefs(command_prefs_1.ANNOUNCE_PREFS_FILE, true);
        const previousAnnounceMsgData = (_c = announcePrefs[msg.guild.id]) === null || _c === void 0 ? void 0 : _c.announceMessages[announceMsgLink];
        if (previousAnnounceMsgData !== undefined) {
            try {
                const trackerMsg = yield bot_core_1.fetchMessageLink(msg.client, previousAnnounceMsgData.trackerMsgLink);
                if (trackerMsg !== undefined)
                    trackerMsg.edit(command_prefs_1.EXPIRED_MESSAGE_TEXT);
            }
            catch (err) {
                console.error(err);
            }
        }
        const trackerMsg = yield msg.channel.send(content);
        bot_core_1.addReactions(trackerMsg, [forward_message_1.acceptEmoji, forward_message_1.rejectEmoji]);
        const announceData = {
            [msg.guild.id]: {
                guildName: msg.guild.name,
                announceMessages: Object.assign(Object.assign({}, ((_e = (_d = announcePrefs[msg.guild.id]) === null || _d === void 0 ? void 0 : _d.announceMessages) !== null && _e !== void 0 ? _e : {})), { [bot_core_1.getMessageLink(announceMsg)]: {
                        trackerMsgLink: bot_core_1.getMessageLink(trackerMsg),
                        createdTimestamp: msg.createdTimestamp,
                        targetChannels: targetChannelIDs.length ? targetChannelIDs : undefined
                    } })
            }
        };
        bot_core_1.updatePrefs(command_prefs_1.ANNOUNCE_PREFS_FILE, announceData);
    });
}
function getMessage(channel, msgLinkOrMessageID) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { channelID, messageID } = (_a = bot_core_1.parseMessageLink(msgLinkOrMessageID)) !== null && _a !== void 0 ? _a : { channelID: undefined, messageID: msgLinkOrMessageID };
        try {
            if (channelID === undefined) {
                return yield channel.messages.fetch(messageID);
            }
            else {
                const ch = yield channel.client.channels.fetch(channelID);
                if (!bot_core_1.isMessageChannel(ch))
                    return undefined;
                return yield ch.messages.fetch(messageID);
            }
        }
        catch (err) {
            return undefined;
        }
    });
}

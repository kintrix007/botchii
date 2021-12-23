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
exports.sendEmbed = exports.createEmbed = exports.embedToString = exports.replyTo = exports.getReplyMessage = exports.fetchMessageLink = exports.parseMessageLink = exports.getMessageLink = exports.getUserString = exports.quoteMessage = exports.addReactions = exports.fetchTextChannels = exports.fetchChannels = exports.cacheMessages = exports.fetchMessages = exports.isMessageChannel = void 0;
const discord_js_1 = require("discord.js");
const general_utils_1 = require("./general_utils");
function isMessageChannel(channel) {
    return channel instanceof discord_js_1.TextChannel || channel instanceof discord_js_1.NewsChannel || channel instanceof discord_js_1.DMChannel;
}
exports.isMessageChannel = isMessageChannel;
function fetchMessages(client, msgLinksOrData) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetMessages = (() => {
            if (isStringArray(msgLinksOrData)) {
                const msgLinks = msgLinksOrData;
                return msgLinks.map(link => {
                    const { channelID, messageID } = parseMessageLink(link);
                    return { channelID, messageID };
                });
            }
            else
                return msgLinksOrData;
        })();
        const messagePromises = targetMessages.map(x => getMessage(client, x));
        const [messages] = yield general_utils_1.awaitAll(messagePromises);
        return messages.filter(general_utils_1.notOf(undefined));
    });
}
exports.fetchMessages = fetchMessages;
function cacheMessages(client, msgLinksOrData) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = yield fetchMessages(client, msgLinksOrData);
        const promises = messages.map(x => x.fetch());
        yield Promise.allSettled(promises);
        return messages;
    });
}
exports.cacheMessages = cacheMessages;
function fetchChannels(client, channelIDs) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelPromises = channelIDs.map(x => client.channels.fetch(x));
        const [channels] = yield general_utils_1.awaitAll(channelPromises);
        return channels;
    });
}
exports.fetchChannels = fetchChannels;
function fetchTextChannels(client, channelIDs) {
    return __awaiter(this, void 0, void 0, function* () {
        const channels = yield fetchChannels(client, channelIDs);
        return channels.map(x => x instanceof discord_js_1.CategoryChannel ? Array.from(x.children.values()) : [x])
            .flat()
            .filter(isMessageChannel);
    });
}
exports.fetchTextChannels = fetchTextChannels;
/**
 * @param msg Message to add the reactions to
 * @param reactions If it's an array, then adds the reactions while keeping the order,
 * if it's a set, then adds the reactions in random order (takes less time)
 */
function addReactions(msg, reactions) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const channel = msg.channel;
        const perms = (channel instanceof discord_js_1.DMChannel ? undefined : channel.permissionsFor(msg.client.user));
        const canReact = (_a = perms === null || perms === void 0 ? void 0 : perms.has("ADD_REACTIONS")) !== null && _a !== void 0 ? _a : false;
        if (!canReact)
            return undefined;
        if (reactions instanceof Array) {
            let reactionsResolved = [];
            for (const reaction of reactions) {
                reactionsResolved.push(yield msg.react(reaction));
            }
            return reactionsResolved;
        }
        else {
            const reactionPromises = [...reactions].map(r => msg.react(r));
            const [reactionsResolved] = yield general_utils_1.awaitAll(reactionPromises);
            return reactionsResolved;
        }
    });
}
exports.addReactions = addReactions;
function quoteMessage(content, maxLength = 50) {
    return "> " + (content.length > maxLength + 3 ? content.slice(0, maxLength) + "..." : content).replace(/\s+/g, " ");
}
exports.quoteMessage = quoteMessage;
function getUserString(user) {
    return `${user.username}#${user.discriminator}`;
}
exports.getUserString = getUserString;
function getMessageLink(msg) {
    const channel = msg.channel;
    if (channel instanceof discord_js_1.GuildChannel) {
        return `https://discord.com/channels/${msg.guild.id}/${channel.id}/${msg.id}`;
    }
    else {
        return `https://discord.com/channels/@me/${channel.id}/${msg.id}`;
    }
}
exports.getMessageLink = getMessageLink;
function parseMessageLink(msgLink) {
    const regex = /^https:\/\/discord.com\/channels\/(?:(\d+)|@me)\/(\d+)\/(\d+)\/?$/i;
    const match = msgLink.match(regex);
    if (!match)
        return undefined;
    const guildID = match[1];
    const channelID = match[2];
    const messageID = match[3];
    return {
        guildID,
        channelID,
        messageID
    };
}
exports.parseMessageLink = parseMessageLink;
function fetchMessageLink(client, msgLink) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const msgData = parseMessageLink(msgLink);
            if (!msgData)
                return undefined;
            const { channelID, messageID } = msgData;
            const channel = yield client.channels.fetch(channelID);
            if (!isMessageChannel(channel))
                return undefined;
            return yield channel.messages.fetch(messageID);
        }
        catch (_a) {
            return undefined;
        }
    });
}
exports.fetchMessageLink = fetchMessageLink;
function getReplyMessage(message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (message.system)
            return undefined;
        const reference = message.reference;
        if (reference == null)
            return undefined;
        const { channelID, messageID } = reference;
        if (messageID == null)
            return undefined;
        if (message.channel.id !== channelID)
            return undefined;
        try {
            const replyMessage = yield message.channel.messages.fetch(messageID);
            return replyMessage;
        }
        catch (err) {
            return undefined;
        }
    });
}
exports.getReplyMessage = getReplyMessage;
/**
 * @param pings Does not do anything, not implemented yet.
 */
function replyTo(message, content, pings = true) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const sentMessage = yield message.client.api.channels[message.channel.id].messages.post({
            data: {
                content: content,
                message_reference: {
                    message_id: message.id,
                    channel_id: message.channel.id,
                    guild_id: (_a = message.guild) === null || _a === void 0 ? void 0 : _a.id,
                },
            },
        });
        return sentMessage;
    });
}
exports.replyTo = replyTo;
// Embeds
const messageColors = {
    ok: 0x00bb00,
    error: 0xbb0000,
    neutral: 0x008888
};
function embedToString(embed) {
    var _a, _b;
    let content = "";
    function addIfExists(property, wrapIn = "", end = "\n") {
        if (property != null)
            content += wrapIn + property + wrapIn + end;
    }
    addIfExists(embed.title, "**", "\n\n");
    addIfExists(embed.description);
    addIfExists((_a = embed.footer) === null || _a === void 0 ? void 0 : _a.text, "*");
    addIfExists((_b = embed.timestamp) === null || _b === void 0 ? void 0 : _b.toString(), "`");
    return content;
}
exports.embedToString = embedToString;
function hasEmbedPerms(target) {
    var _a, _b;
    if (target instanceof discord_js_1.Message) {
        const msg = target;
        const channel = msg.channel;
        const perms = (channel instanceof discord_js_1.DMChannel ? undefined : channel.permissionsFor(target.client.user));
        return (_a = perms === null || perms === void 0 ? void 0 : perms.has("EMBED_LINKS")) !== null && _a !== void 0 ? _a : false;
    }
    else if (target instanceof discord_js_1.User) {
        return true;
    }
    else {
        const channel = target;
        const perms = (channel instanceof discord_js_1.DMChannel ? undefined : channel.permissionsFor(target.client.user));
        return (_b = perms === null || perms === void 0 ? void 0 : perms.has("EMBED_LINKS")) !== null && _b !== void 0 ? _b : false;
    }
}
function createEmbed(type, message) {
    let messageEmbed = new discord_js_1.MessageEmbed().setColor(messageColors[type]);
    if (typeof message === "string") {
        messageEmbed.setDescription(message);
    }
    else {
        if (message.title)
            messageEmbed.setTitle(message.title);
        if (message.desc)
            messageEmbed.setDescription(message.desc);
        if (message.footer)
            messageEmbed.setFooter(message.footer);
        if (message.image)
            messageEmbed.setImage(message.image);
        if (message.timestamp)
            messageEmbed.setTimestamp(message.timestamp);
    }
    const messageText = embedToString(messageEmbed);
    return (target) => {
        const hasPerms = hasEmbedPerms(target);
        return hasPerms ? messageEmbed : messageText;
    };
}
exports.createEmbed = createEmbed;
function sendEmbed(target, type, message) {
    let sendTarget;
    if (target instanceof discord_js_1.Message) {
        const msg = target;
        sendTarget = msg.channel;
    }
    else if (target instanceof discord_js_1.User) {
        sendTarget = target;
    }
    else {
        sendTarget = target;
    }
    const embedOrString = createEmbed(type, message)(sendTarget);
    return typeof embedOrString == "string" ? sendTarget.send(embedOrString) : sendTarget.send(undefined, embedOrString);
}
exports.sendEmbed = sendEmbed;
// local utility
function isStringArray(arr) {
    if (!(arr instanceof Array))
        return false;
    return arr.every(x => typeof x === "string");
}
function getMessage(client, { channelID, messageID }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const channel = yield client.channels.fetch(channelID);
            if (!isMessageChannel(channel))
                return undefined;
            return yield channel.messages.fetch(messageID);
        }
        catch (_a) {
            return undefined;
        }
    });
}

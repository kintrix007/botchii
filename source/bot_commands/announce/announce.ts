import { getReplyMessage, getMessageLink, sendEmbed, loadPrefs, getPrefix, quoteMessage, fetchMessageLink, addReactions, updatePrefs, parseMessageLink, Command, CommandCallData, Prefs, adminPermission, replyTo } from "../../_core/bot_core";
import { DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { AnnounceData, ANNOUNCE_PREFS_FILE, ChannelData, CHANNEL_PREFS_FILE, EXPIRED_MESSAGE_TEXT } from "../command_prefs";
import * as Utilz from "../../utilz";
import { setup, acceptEmoji, rejectEmoji, scoreToForward } from "./forward_message"
import { getContentAndShouldForward } from "./announce_tracker";

const description = `Creates an announcement poll for a given message. If accepted it forwards the message to all of the target channels.
You can specify where to announce the message, which can be a channel alias.
When omitted announces to the currently set target channels.
Every announcement message is only valid for 3 days. After this time, it counts as rejected.`;

export default <Command>{
    setup:       setup,
    call:        cmdAnnounce,
    name:        "announce",
    group:       "announcement",
    aliases:     [ "forward" ],
    permissions: [ adminPermission ],
    usage:       "announce <message link> [target channels...]",
    description: description,
    examples:    [ ["https://discord.com/channels/123456789012345678/012345678901234567/234567890123456789"], ["234567890123456789", "#announcements"] ]
};

async function cmdAnnounce({ msg, args }: CommandCallData) {
    const replyMessage = await getReplyMessage(msg);
    const announceMsgLinkOrID = (!!replyMessage ? getMessageLink(replyMessage) : args[0]);
    const targetChannelAliases = (!!replyMessage ? args.slice(0) : args.slice(1));
    if (!announceMsgLinkOrID) {
        sendEmbed(msg, "error", "Gib Msseage link .-.");
        return;
    }
    
    const channelData = loadPrefs<ChannelData>(CHANNEL_PREFS_FILE)[msg.guild!.id];
    const announceMsg = await getMessage(msg.channel, announceMsgLinkOrID);
    if (announceMsg === undefined) {
        sendEmbed(msg, "error", "The message link is either invalid, or points to a message the bot cannot see.");
        return;
    }
    
    const announceMsgLink = getMessageLink(announceMsg);
    if (!channelData?.fromChannels?.includes(announceMsg.channel.id)) {
        sendEmbed(msg, "error", {
            title: "Can only announce messages from the base channels!",
            desc:  `Use the command \`${getPrefix(msg.guild!.id)}channel\` to see the currently set base channels.`
        });
        return;
    }

    const customTargetChannels = Utilz.parseChannels(msg.guild!, targetChannelAliases);
    const targetChannelIDs = (customTargetChannels.length === 0
        ? loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id]?.toChannels
        : customTargetChannels);
    
    if (targetChannelIDs === undefined) {
        sendEmbed(msg, "error", {
            title: "No target channels are given!",
            desc:  `Use the command \`${getPrefix(msg.guild!.id)}channel\` to see the default target channels.`
        });
        return;
    }

    const { content } = getContentAndShouldForward({}, announceMsg, targetChannelIDs);

    const announcePrefs = loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true);
    const previousAnnounceMsgData = announcePrefs[msg.guild!.id]?.announceMessages[announceMsgLink];
    if (previousAnnounceMsgData !== undefined) {
        try {
            const trackerMsg = await fetchMessageLink(msg.client, previousAnnounceMsgData.trackerMsgLink);
            if (trackerMsg !== undefined) trackerMsg.edit(EXPIRED_MESSAGE_TEXT);
        } catch (err) {
            console.error(err);
        }
    }
    
    const trackerMsg = await msg.channel.send(content);
    addReactions(trackerMsg, [ acceptEmoji, rejectEmoji ]);

    
    const announceData: Prefs<AnnounceData> = {
        [msg.guild!.id]: {
            guildName:        msg.guild!.name,
            announceMessages: {
                ...(announcePrefs[msg.guild!.id]?.announceMessages ?? {}),
                ...{[getMessageLink(announceMsg)]: {
                    trackerMsgLink:  getMessageLink(trackerMsg),
                    createdTimestamp: msg.createdTimestamp,
                    targetChannels:  targetChannelIDs.length ? targetChannelIDs : undefined
                }}
            }
        }
    };
    updatePrefs(ANNOUNCE_PREFS_FILE, announceData);
}

async function getMessage(channel: TextChannel | NewsChannel | DMChannel, msgLinkOrMessageID: string) {
    const { channelID, messageID } = parseMessageLink(msgLinkOrMessageID) ?? { channelID: undefined, messageID: msgLinkOrMessageID };

    try {
        if (channelID === undefined) {
            return await channel.messages.fetch(messageID);
        } else {
            const ch = await channel.client.channels.fetch(channelID);
            if (!Utilz.isTextChannel(ch)) return undefined;
            return await ch.messages.fetch(messageID);
        }
    } catch (err) {
        return undefined;
    }
}

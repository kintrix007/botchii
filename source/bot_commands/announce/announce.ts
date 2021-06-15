import * as types from "../../_core/types";
import * as BotUtils from "../../_core/bot_utils";
import { DMChannel, NewsChannel, TextChannel } from "discord.js";
import { AnnounceData, ANNOUNCE_PREFS_FILE, ChannelData, CHANNEL_PREFS_FILE, EXPIRED_MESSAGE_TEXT } from "../command_prefs";
import * as Utilz from "../../utilz";
import { setup, acceptEmoji, rejectEmoji, scoreToForward } from "./forward_message"

const description = `Creates an announcement poll for a given message. If accepted it forwards the message to all of the target channels.
You can specify where to announce the message, which can be a channel alias.
When omitted announces to the currently set target channels.
Every announcement message is only valid for 3 days. After this time, it counts as rejected.`;

const cmd: types.Command = {
    setup:       setup,
    call:        cmdAnnounce,
    name:        "announce",
    group:       "announcement",
    aliases:     [ "forward" ],
    usage:       "announce <message link> [target channels...]",
    description: description,
    examples:    [ ["https://discord.com/channels/123456789012345678/012345678901234567/234567890123456789"], ["234567890123456789", "#announcements"] ]
};

async function cmdAnnounce({ msg, args }: types.CommandCallData) {
    const replyMessage = await BotUtils.getReplyMessage(msg);
    const announceMsgLinkOrID = (!!replyMessage ? BotUtils.getMessageLink(replyMessage) : args[0]);
    const targetChannelAliases = (!!replyMessage ? args.slice(0) : args.slice(1));
    if (!announceMsgLinkOrID) {
        BotUtils.sendEmbed(msg, "error", "Gib Msseage link .-.");
        return;
    }
    
    const channelData = BotUtils.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE)[msg.guild!.id];
    const announceMsg = await getMessage(msg.channel, announceMsgLinkOrID);
    if (announceMsg === undefined) {
        BotUtils.sendEmbed(msg, "error", "The message link is either invalid, or points to a message the bot cannot see.");
        return;
    }
    
    const announceMsgLink = BotUtils.getMessageLink(announceMsg);
    if (!channelData?.fromChannels?.includes(announceMsg.channel.id)) {
        BotUtils.sendEmbed(msg, "error", {
            title: "Can only announce messages from the base channels!",
            desc:  `Use the command \`${BotUtils.getPrefix(msg.guild!.id)}channel\` to see the currently set base channels.`
        });
        return;
    }

    const customTargetChannels = Utilz.parseChannels(msg.guild!, targetChannelAliases);
    const targetChannelIDs = (customTargetChannels.length === 0
        ? BotUtils.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id]?.toChannels
        : customTargetChannels);
    
    if (targetChannelIDs === undefined) {
        BotUtils.sendEmbed(msg, "error", {
            title: "No target channels are given!",
            desc:  `Use the command \`${BotUtils.getPrefix(msg.guild!.id)}channel\` to see the default target channels.`
        });
        return;
    }

    const content = BotUtils.getMessageLink(announceMsg)
    + (announceMsg.content ? "\n" + BotUtils.quoteMessage(announceMsg, 75) : "") + "\n"
    + (targetChannelIDs.length ? "\n**to:** " + targetChannelIDs.map(x => "<#"+x+">").join(", ") : "")
    + `\n**${scoreToForward} to go**`;

    const announcePrefs = BotUtils.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true);
    const previousAnnounceMsgData = announcePrefs[msg.guild!.id]?.announceMessages[announceMsgLink];
    console.log({previousAnnounceMsgData});
    if (!!previousAnnounceMsgData) {
        try {
            const trackerMsg = await BotUtils.fetchMessageLink(msg.client, previousAnnounceMsgData.trackerMsgLink);
            if (trackerMsg !== undefined) trackerMsg.edit(EXPIRED_MESSAGE_TEXT);
        }
        catch (err) {
            console.error(err);
        }
    }
    
    const trackerMsg = await msg.channel.send(content);
    BotUtils.addReactions(trackerMsg, [ acceptEmoji, rejectEmoji ]);

    
    const announceData: types.Prefs<AnnounceData> = {
        [msg.guild!.id]: {
            guildName:        msg.guild!.name,
            announceMessages: {
                ...(announcePrefs[msg.guild!.id]?.announceMessages ?? {}),
                ...{[BotUtils.getMessageLink(announceMsg)]: {
                    trackerMsgLink:  BotUtils.getMessageLink(trackerMsg),
                    createdTimestamp: msg.createdTimestamp,
                    targetChannels:  targetChannelIDs.length ? targetChannelIDs : undefined
                }}
            }
        }
    };
    BotUtils.updatePrefs(ANNOUNCE_PREFS_FILE, announceData);
}

async function getMessage(channel: TextChannel | NewsChannel | DMChannel, msgLinkOrMessageID: string) {
    const { channelID, messageID } = BotUtils.parseMessageLink(msgLinkOrMessageID) ?? { channelID: undefined, messageID: msgLinkOrMessageID };

    try {
        if (channelID === undefined) {
            return await channel.messages.fetch(messageID);
        } else {
            const ch = await channel.client.channels.fetch(channelID);
            if (!Utilz.isTextChannel(ch)) return undefined;
            return await ch.messages.fetch(messageID);
        }
    }
    catch (err) {
        return undefined;
    }
}

module.exports = cmd;

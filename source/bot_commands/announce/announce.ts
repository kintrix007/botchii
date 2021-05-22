import * as types from "../../_core/types";
import * as CoreTools from "../../_core/core_tools";
import { DMChannel, NewsChannel, TextChannel } from "discord.js";
import { AnnounceData, ANNOUNCE_PREFS_FILE, ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";
import * as Utilz from "../../utilz";
import { setup, acceptEmoji, rejectEmoji, scoreToForward } from "./forward_message"

const description = `Creates an announcement poll for a given message. If accepted it forwards the message to all of the target channels.
You can specify where to announce the message, which can be a channel alias.
When omitted announces to the currently set target channels.
Every announcement message is only valid for 3 days. After this time, it counts as rejected.`;

const cmd: types.Command = {
    setupFunc:   setup,
    func:        cmdAnnounce,
    name:        "announce",
    group:       "announcement",
    aliases:     [ "forward" ],
    usage:       "announce <message link> [target channels...]",
    description: description,
    examples:    [ "https://discord.com/channels/123456789012345678/012345678901234567/234567890123456789", "234567890123456789 #announcements" ]
};

async function cmdAnnounce({ msg, args }: types.CombinedData) {
    const announceMessageLink = args[0];
    const targetChannelAliases = args.slice(1);

    if (!announceMessageLink) {
        CoreTools.sendEmbed(msg, "error", "Gib Msseage link .-.");
        return;
    }

    const channelData = CoreTools.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE)[msg.guild!.id];
    const announceMsg = await getMessage(msg.channel, announceMessageLink);

    if (!announceMsg) {
        CoreTools.sendEmbed(msg, "error", "The message link is either invalid, or points to a message the bot cannot see.");
        return;
    }

    if (!channelData?.fromChannels?.includes(announceMsg.channel.id)) {
        CoreTools.sendEmbed(msg, "error", {
            title: "Can only announce messages from the base channels!",
            desc:  "Use the command \`channel\` to see the currently set base channels."
        });
        return;
    }

    const customTargetChannels = Utilz.parseChannels(msg.guild!, targetChannelAliases);
    const targetChannelIDs = (customTargetChannels.length === 0
        ? CoreTools.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id]?.toChannels
        : customTargetChannels);
    
    if (!targetChannelIDs) {
        CoreTools.sendEmbed(msg, "error", {
            title: "No target channels are given!",
            desc:  "Use the command \`channel\` to see the default target channels."
        });
        return;
    }

    const content = CoreTools.getMessageLink(announceMsg)
        + (announceMsg.content ? "\n" + CoreTools.quoteMessage(announceMsg, 75) : "") + "\n"
        + (targetChannelIDs.length ? "\n**to:** " + targetChannelIDs.map(x => "<#"+x+">").join(", ") : "")
        + `\n**${scoreToForward} to go**`;

    const trackerMsg = await msg.channel.send(content);
    CoreTools.addReactions(trackerMsg, [ acceptEmoji, rejectEmoji ]);

    const announcePrefs = CoreTools.loadPrefs<AnnounceData>(ANNOUNCE_PREFS_FILE, true);
    const announceData: types.Prefs<AnnounceData> = {
        [msg.guild!.id]: {
            guildName:       msg.guild!.name,
            announceMessages: {
                ...(announcePrefs[msg.guild!.id]?.announceMessages ?? {}),
                ...{[CoreTools.getMessageLink(announceMsg)]: {
                    trackerMsgLink:  CoreTools.getMessageLink(trackerMsg),
                    createdTimestamp: msg.createdTimestamp,
                    targetChannels:  targetChannelIDs.length ? targetChannelIDs : undefined
                }}
            }
        }
    };
    CoreTools.updatePrefs(ANNOUNCE_PREFS_FILE, announceData);
}

async function getMessage(ch: TextChannel | NewsChannel | DMChannel, msgLinkOrMessageID: string) {
    const { channelID, messageID } = CoreTools.parseMessageLink(msgLinkOrMessageID) ?? { channelID: undefined, messageID: msgLinkOrMessageID };

    try {
        if (channelID === undefined) {
            return await ch.messages.fetch(messageID);
        } else {
            const channel = await ch.client.channels.fetch(channelID);
            if (!Utilz.isTextChannel(channel)) return undefined;
            return await channel.messages.fetch(messageID);
        }
    }
    catch (err) {
        return undefined;
    }
}

module.exports = cmd;

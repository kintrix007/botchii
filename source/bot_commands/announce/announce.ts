import * as types from "../../_core/types";
import * as CoreTools from "../../_core/core_tools";
import { DMChannel, NewsChannel, TextChannel } from "discord.js";
import { AnnounceData, ANNOUNCE_PREFS_FILE } from "../command_prefs";
import * as Utilz from "../../utilz";
import { setup, acceptEmoji, rejectEmoji, scoreToForward } from "./forward_message"

const cmd: types.Command = {
    setupFunc:   setup,
    func:        cmdAnnounce,
    name:        "announce",
    permissions: [ CoreTools.channelSpecificCmdPermission("SEND_MESSAGES") ],
    group:       "announcement",
    // aliases:     [  ],
    usage:       "announce <message link> [target channels...]",
    description: "",
    examples:    [ "https://discord.com/channels/123456789012345678/012345678901234567/234567890123456789", "234567890123456789 #announcements" ]
};

async function cmdAnnounce({ msg, args }: types.CombinedData) {
    const announceMessageLink = args[0];
    const targetChannelAliases = args.slice(1);

    if (!announceMessageLink) {
        CoreTools.sendEmbed(msg, "error", "Gib Msseage link .-.");
        return;
    }

    const { channelID, messageID } = CoreTools.parseMessageLink(args[0]) ?? { channelID: undefined, messageID: args[0] };

    const getMessage = async () => {
        try {
            if (channelID === undefined) {
                return await msg.channel.messages.fetch(messageID);
            } else {
                const channel = await msg.client.channels.fetch(channelID) as TextChannel | NewsChannel | DMChannel;
                return await channel.messages.fetch(messageID);
            }
        }
        catch (err) {
            return undefined;
        }
    }

    const announceMsg = await getMessage();

    if (!announceMsg) {
        CoreTools.sendEmbed(msg, "error", "Gib gud message link .-.");
        return;
    }

    const targetChannelIDs = Utilz.parseChannels(msg.guild!, targetChannelAliases);
    const content = CoreTools.getMessageLink(announceMsg)
        + (announceMsg.content ? "\n" + CoreTools.quoteMessage(announceMsg, 75) : "")
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
                    targetChannels:  targetChannelIDs.length ? targetChannelIDs : undefined
                }}
            }
        }
    };
    CoreTools.updatePrefs(ANNOUNCE_PREFS_FILE, announceData);
}

module.exports = cmd;

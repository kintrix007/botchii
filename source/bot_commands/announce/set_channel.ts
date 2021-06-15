import * as BotUtils from "../../_core/bot_utils";
import { CommandCallData, Prefs } from "../../_core/types";
import * as Utilz from "../../utilz";
import { ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";

export default async function cmdSetChannel({ msg, args }: CommandCallData, mode: "base" | "target") {
    const channels = await Utilz.fetchTextChannels(msg.client, Utilz.parseChannels(msg.guild!, args));

    if (channels.length === 0) {
        BotUtils.sendEmbed(msg, "error", "No valid channels given.");
        return;
    }

    const channelData: Prefs<ChannelData> = (() => {
        switch (mode) {
        case "base": {
            const channelData: Prefs<ChannelData> = {
                [msg.guild!.id]: {
                    ...(BotUtils.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id] ?? {}),
                    guildName:    msg.guild!.name,
                    fromChannels: channels.map(x => x.id)
                }
            };
            return channelData;
        }
        case "target": {
            const channelData: Prefs<ChannelData> = {
                [msg.guild!.id]: {
                    ...(BotUtils.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id] ?? {}),
                    guildName:  msg.guild!.name,
                    toChannels: channels.map(x => x.id)
                }
            };
            return channelData;
        }
        }
    })();
    
    BotUtils.updatePrefs(CHANNEL_PREFS_FILE, channelData);
    BotUtils.sendEmbed(msg, "ok", {
        title: `Succesfully set ${mode} channel${channels.length === 1 ? '' : 's'}!`,
        desc:  `channels: ${channels.join(", ")}`
    });
}

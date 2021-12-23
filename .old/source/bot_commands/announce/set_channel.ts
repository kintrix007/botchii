import { sendEmbed, loadPrefs, updatePrefs, CommandCallData, Prefs, parseChannels, fetchTextChannels } from "../../_core/bot_core";
import { ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";

export default async function cmdSetChannel({ msg, args }: CommandCallData, mode: "base" | "target") {
    const channels = await fetchTextChannels(msg.client, parseChannels(msg.guild!, args));

    if (channels.length === 0) {
        sendEmbed(msg, "error", "No valid channels given.");
        return;
    }

    const channelData: Prefs<ChannelData> = (() => {
        switch (mode) {
        case "base": {
            const channelData: Prefs<ChannelData> = {
                [msg.guild!.id]: {
                    ...(loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id] ?? {}),
                    guildName:    msg.guild!.name,
                    fromChannels: channels.map(x => x.id)
                }
            };
            return channelData;
        }
        case "target": {
            const channelData: Prefs<ChannelData> = {
                [msg.guild!.id]: {
                    ...(loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id] ?? {}),
                    guildName:  msg.guild!.name,
                    toChannels: channels.map(x => x.id)
                }
            };
            return channelData;
        }
        }
    })();
    
    updatePrefs(CHANNEL_PREFS_FILE, channelData);
    sendEmbed(msg, "ok", {
        title: `Succesfully set ${mode} channel${channels.length === 1 ? '' : 's'}!`,
        desc:  `channels: ${channels.join(", ")}`
    });
}

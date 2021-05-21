import * as CoreTools from "../../_core/core_tools";
import * as types from "../../_core/types";
import * as Utilz from "../../utilz";
import { ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";

export default async function cmdSetChannel({ msg, args }: types.CombinedData, mode: "base" | "target") {
    const channels = await Utilz.fetchTextChannels(msg.client, Utilz.parseChannels(msg.guild!, args));

    if (channels.length === 0) {
        CoreTools.sendEmbed(msg, "error", "No valid channels given.");
        return;
    }

    const channelData: types.Prefs<ChannelData> = (() => {
        if (mode === "base") {
            const channelData: types.Prefs<ChannelData> = {
                [msg.guild!.id]: {
                    ...(CoreTools.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id] ?? {}),
                    guildName:    msg.guild!.name,
                    fromChannels: channels.map(x => x.id)
                }
            };
            return channelData;
        } else {
            const channelData: types.Prefs<ChannelData> = {
                [msg.guild!.id]: {
                    ...(CoreTools.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE, true)[msg.guild!.id] ?? {}),
                    guildName:  msg.guild!.name,
                    toChannels: channels.map(x => x.id)
                }
            };
            return channelData;
        }
    })();
    
    CoreTools.updatePrefs(CHANNEL_PREFS_FILE, channelData);
    CoreTools.sendEmbed(msg, "ok", {
        title: `Succesfully set ${mode} channel${channels.length === 1 ? '' : 's'}!`,
        desc:  `channels: ${channels.join(", ")}`
    });
}

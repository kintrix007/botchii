import * as BotUtils from "../../_core/bot_utils";
import { CommandCallData } from "../../_core/types";
import { ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";

export default async function cmdGetChannel({ msg }: CommandCallData) {
    const channelPrefs = BotUtils.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE);
    const channelData  = channelPrefs[msg.guild!.id];

    const fromChannelStrings = channelData?.fromChannels?.map(x => "<#"+x+">").join(", ") ?? "None set...";
    const toChannelStrings   = channelData?.toChannels  ?.map(x => "<#"+x+">").join(", ") ?? "None set...";

    BotUtils.sendEmbed(msg, "neutral", {
        title: "Channels",
        desc: `base: ${fromChannelStrings}\ntarget: ${toChannelStrings}`
    });
}

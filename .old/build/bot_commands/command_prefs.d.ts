import { Snowflake } from "discord.js";
import { CustomEmoji } from "../custom_types";
export interface AnnounceData {
    announceMessages: {
        [announceMsgLink: string]: {
            trackerMsgLink: string;
            createdTimestamp: number;
            targetChannels?: Snowflake[];
        };
    };
}
export interface ChannelData {
    fromChannels?: string[];
    toChannels?: string[];
}
export interface ReactionRoles {
    [roleID: string]: CustomEmoji;
}
export interface RRData {
    targetChannelID: string;
    reactionRolesMessageID?: string;
    reactionRoles?: ReactionRoles;
}
export declare const ANNOUNCE_PREFS_FILE = "announce_messages";
export declare const RR_PREFS_FILE = "reaction_roles";
export declare const CHANNEL_PREFS_FILE = "channel";
export declare const EXPIRED_MESSAGE_TEXT = "**-- Announcement timed out! --**";

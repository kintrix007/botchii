import { Snowflake } from "discord.js";
import { CustomEmoji } from "../custom_types";

export interface AnnounceData {
    announceMessages: {
        [announceMsgLink: string]: {
            trackerMsgLink:   string;
            createdTimestamp: number;
            targetChannels?:  Snowflake[];
        };
    };
}

export interface AliasData {
    aliases: {
        [alias: string]: Snowflake[];
    }
}

export interface ChannelData {
    fromChannels?: string[];
    toChannels?:   string[];
}


export interface ReactionRoles {
    [roleID: string]: CustomEmoji;
}
export interface RRData {
    targetChannelID:         string;
    reactionRolesMessageID?: string;
    reactionRoles?:          ReactionRoles;
}

export const ANNOUNCE_PREFS_FILE = "announce_messages";
export const ALIAS_PREFS_FILE    = "aliases";
export const RR_PREFS_FILE       = "reaction_roles";
export const CHANNEL_PREFS_FILE  = "channel";

export const EXPIRED_MESSAGE_TEXT = "**-- Announcement timed out! --**"

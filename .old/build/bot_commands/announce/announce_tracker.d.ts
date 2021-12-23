import { Message } from "discord.js";
import { UserReactions } from "../../custom_types";
export declare function getContentAndShouldForward(userReactions: UserReactions, announceMsg: Message | undefined, targetChannelIDs: Set<string> | string[]): {
    shouldForward: boolean;
    content: string;
};

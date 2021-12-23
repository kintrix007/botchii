import { CountedEmoji, UserReactions } from "./custom_types";
import { MessageReaction } from "discord.js";
export declare const PICS_DIR: string;
export declare function convertToCountedEmoji(reaction: MessageReaction): CountedEmoji;
export declare function convertToUserReactions(reactions: MessageReaction[], fromCache?: boolean): Promise<UserReactions>;
export declare function union<T>(a: Set<T>, b: Set<T>): Set<T>;
export declare function intersection<T>(a: Set<T>, b: Set<T>): Set<T>;
export declare function difference<T>(a: Set<T>, b: Set<T>): Set<T>;
export declare function outersection<T>(a: Set<T>, b: Set<T>): Set<T>;

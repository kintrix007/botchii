import { User } from "discord.js";


export interface CustomEmoji {
    isCustom:   boolean;
    string:     string;
    isInvalid?: boolean;
}

export interface CountedEmoji extends CustomEmoji {
    count:      number;
    users:      User[];
}

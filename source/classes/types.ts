import * as DC from "discord.js";

// NOT framework specific
export interface Data {
    client:         DC.Client;
    defaultPrefix:  string;
}

// framework-specific
export interface CombinedData {
    data:       Data;
    msg:        DC.Message;
    args:       string[];
    cmdStr:     string;
    argsStr:    string;
    cont:       string;
}

// Bot Command
export type CommandGroup = "help" | "admin" | "owner" | "moderation" | "roles" | "utility" | "";

export interface Command {
    setupFunc?:     (data: Data) => Promise<any>;
    func:           (combData: CombinedData) => any;
    name:           string;
    group?:         CommandGroup;
    aliases?:       string[];
    usage?:         string;
    description?:   string;
    examples?:      string[];
    adminCommand?:  boolean;
    ownerCommand?:  boolean;
}

// Bot specific

export interface CustomEmoji {
    isCustom:   boolean;
    string:     string;
    isInvalid?: boolean;
}

export interface CountedEmoji extends CustomEmoji {
    count:      number;
    users:      DC.User[];
}

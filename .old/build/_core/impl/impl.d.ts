import { Message, Snowflake } from "discord.js";
import { CommandContentModifier } from "../types";
export declare class Impl {
    private CONFIG_FILE;
    private _defaultPrefix;
    private _messageContentModifiers;
    private _configObj;
    loadConfigFile(): void;
    checkConfigErorrs(): void;
    get botToken(): string;
    get ownerID(): Snowflake;
    get defaultPrefix(): string;
    set defaultPrefix(newPrefix: string);
    set messageContentModifiers(arr: CommandContentModifier[]);
    applyMessageContentModifiers(cont: string): string;
    /** returns the contents of `msg` after removing the prefix from the beginning of it */
    prefixless(msg: Message): string | undefined;
}

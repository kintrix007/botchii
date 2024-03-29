import { Message, Snowflake } from "discord.js";
import { getPrefix, ROOT_DIR } from "../utils/bot_utils";
import { CommandContentModifier } from "../types";
import path from "path";
import fs from "fs";

export class Impl {
    private CONFIG_FILE = path.join(ROOT_DIR, "config.json");
    private _defaultPrefix: string | undefined = undefined;
    private _messageContentModifiers: CommandContentModifier[] | undefined = undefined;
    private _configObj: ReturnType<typeof JSON.parse> = undefined;
    
    
    public loadConfigFile() {
        if (!fs.existsSync(this.CONFIG_FILE)) throw new Error(`file '${this.CONFIG_FILE}' does not exist!`);
        this._configObj = JSON.parse(fs.readFileSync(this.CONFIG_FILE).toString());
    }

    public checkConfigErorrs() {
        let errors: Error[] = [];
        try {
            if (this._configObj === undefined) this.loadConfigFile();
            if (typeof this._configObj !== "object" || this._configObj == null) {
                errors.push(new Error(`'${this.CONFIG_FILE}' does not contain a JSON object!`));
            } else {
                if (typeof this._configObj.botToken !== "string") errors.push(new Error(`field 'botToken' is not a string in '${this.CONFIG_FILE}'`));
                if (typeof this._configObj.botOwnerID !== "string") errors.push(new Error(`field 'botOwnerID' is not a string in '${this.CONFIG_FILE}'`));
            }
        } catch (err) {
            if (err instanceof Error) errors.push(err);
        }

        errors.forEach(error => { throw error });
    }

    get botToken(): string {
        if (this._configObj === undefined) this.loadConfigFile();
        const token = this._configObj.botToken;
        if (typeof token !== "string") throw new Error(`field 'botToken' is not a string in '${this.CONFIG_FILE}'`);
        return token;
    }
    
    get ownerID(): Snowflake {
        if (this._configObj === undefined) this.loadConfigFile();
        const ownerID = this._configObj.botOwnerID;
        if (typeof ownerID !== "string") throw new Error(`field 'botOwnerID' is not a string in '${this.CONFIG_FILE}'`);
        return ownerID;
    }
    
    get defaultPrefix(): string {
        if (this._defaultPrefix === undefined) throw new Error("default prefix is undefined!");
        return this._defaultPrefix!;
    }

    set defaultPrefix(newPrefix: string) {
        if (this._defaultPrefix !== undefined) throw new Error("'defaultPrefix' is already set!");
        this._defaultPrefix = newPrefix;
    }
    
    set messageContentModifiers(arr: CommandContentModifier[]) {
        if (this._messageContentModifiers !== undefined) throw new Error("'messageContentModifiers' is already set!");
        this._messageContentModifiers = [...arr]; // set it to a copy, not a reference
    }
    
    public applyMessageContentModifiers(cont: string) {
        return this._messageContentModifiers!.reduce((cont, modifier) => modifier(cont), cont);
    }

    /** returns the contents of `msg` after removing the prefix from the beginning of it */
    public prefixless(msg: Message): string | undefined {
        const guild = msg.guild;
        if (!guild) return undefined;
        const cont = msg.content;
        const prefix = this.applyMessageContentModifiers(getPrefix(guild.id));
        
        if (this.applyMessageContentModifiers(cont).startsWith(prefix)) {
            return cont.slice(prefix.length);
        }

        const regex = new RegExp(`^<@!?${msg.client.user!.id}>\\s*(.+?)\\s*$`, "i");
        const match = cont.match(regex);
        if (!match) return undefined;

        return match[1];
    }
}
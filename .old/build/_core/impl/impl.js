"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Impl = void 0;
const bot_utils_1 = require("../utils/bot_utils");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Impl {
    constructor() {
        this.CONFIG_FILE = path_1.default.join(bot_utils_1.ROOT_DIR, "config.json");
        this._defaultPrefix = undefined;
        this._messageContentModifiers = undefined;
        this._configObj = undefined;
    }
    loadConfigFile() {
        if (!fs_1.default.existsSync(this.CONFIG_FILE))
            throw new Error(`file '${this.CONFIG_FILE}' does not exist!`);
        this._configObj = JSON.parse(fs_1.default.readFileSync(this.CONFIG_FILE).toString());
    }
    checkConfigErorrs() {
        let errors = [];
        try {
            if (this._configObj === undefined)
                this.loadConfigFile();
            if (typeof this._configObj !== "object" || this._configObj == null) {
                errors.push(new Error(`'${this.CONFIG_FILE}' does not contain a JSON object!`));
            }
            else {
                if (typeof this._configObj.botToken !== "string")
                    errors.push(new Error(`field 'botToken' is not a string in '${this.CONFIG_FILE}'`));
                if (typeof this._configObj.botOwnerID !== "string")
                    errors.push(new Error(`field 'botOwnerID' is not a string in '${this.CONFIG_FILE}'`));
            }
        }
        catch (err) {
            if (err instanceof Error)
                errors.push(err);
        }
        errors.forEach(error => { throw error; });
    }
    get botToken() {
        if (this._configObj === undefined)
            this.loadConfigFile();
        const token = this._configObj.botToken;
        if (typeof token !== "string")
            throw new Error(`field 'botToken' is not a string in '${this.CONFIG_FILE}'`);
        return token;
    }
    get ownerID() {
        if (this._configObj === undefined)
            this.loadConfigFile();
        const ownerID = this._configObj.botOwnerID;
        if (typeof ownerID !== "string")
            throw new Error(`field 'botOwnerID' is not a string in '${this.CONFIG_FILE}'`);
        return ownerID;
    }
    get defaultPrefix() {
        if (this._defaultPrefix === undefined)
            throw new Error("default prefix is undefined!");
        return this._defaultPrefix;
    }
    set defaultPrefix(newPrefix) {
        if (this._defaultPrefix !== undefined)
            throw new Error("'defaultPrefix' is already set!");
        this._defaultPrefix = newPrefix;
    }
    set messageContentModifiers(arr) {
        if (this._messageContentModifiers !== undefined)
            throw new Error("'messageContentModifiers' is already set!");
        this._messageContentModifiers = [...arr]; // set it to a copy, not a reference
    }
    applyMessageContentModifiers(cont) {
        return this._messageContentModifiers.reduce((cont, modifier) => modifier(cont), cont);
    }
    /** returns the contents of `msg` after removing the prefix from the beginning of it */
    prefixless(msg) {
        const guild = msg.guild;
        if (!guild)
            return undefined;
        const cont = msg.content;
        const prefix = this.applyMessageContentModifiers(bot_utils_1.getPrefix(guild.id));
        if (this.applyMessageContentModifiers(cont).startsWith(prefix)) {
            return cont.slice(prefix.length);
        }
        const regex = new RegExp(`^<@!?${msg.client.user.id}>\\s*(.+?)\\s*$`, "i");
        const match = cont.match(regex);
        if (!match)
            return undefined;
        return match[1];
    }
}
exports.Impl = Impl;

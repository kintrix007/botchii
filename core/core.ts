import { ApplicationCommandPermissionData, Client, EmbedFieldData, Intents, MessageEmbed, Snowflake } from "discord.js";
import { token, ownerId } from "../config.json"
import { loadCommands } from "./commandLoader";
import { GuildPreferences, ReplyStatus, REPLY_STATUS } from "./types";
import fs from "fs";
import path from "path";

type EmbedLiteral = {
    author?: {
        name:     string;
        iconURL?: string;
        url?:     string;
    };
    title?:       string;
    desc?: string;
    fields?:      EmbedFieldData[] | EmbedFieldData[][];
    footer?: {
        text:     string;
        iconURL?: string;
    };
    image?:       string;
    thumbnail?:   string;
    timestamp?:   number | Date | true;
    URL?:         string;
};

const DEFAULT_CLIENT = new Client({
    intents: [ Intents.FLAGS.GUILDS ],
    allowedMentions: { parse: [ "users" ], repliedUser: true }
});
const PREFS_DIR = path.join(__dirname, "..", "prefs");

export type Literal = string | number | boolean | undefined | null | void | {};

export const BotOwnerPermission: (isAllow: boolean) => ApplicationCommandPermissionData = isAllow => ({
    type: "USER",
    id: ownerId,
    permission: isAllow,
});

export function tuple<T extends Literal[]>(...args: T) { return args };

export function createEmbed(status: ReplyStatus, content: string | EmbedLiteral) {
    const embed = new MessageEmbed();
    embed.setColor(REPLY_STATUS[status]);
    if (typeof content === "string") {
        embed.setDescription(content);
    } else {
        if (content.author)    embed.setAuthor(content.author.name, content.author.iconURL, content.author.url);
        if (content.title)     embed.setTitle(content.title);
        if (content.desc)      embed.setDescription(content.desc);
        if (content.fields)    embed.setFields(...content.fields);
        if (content.footer)    embed.setFooter(content.footer.text, content.footer.iconURL);
        if (content.image)     embed.setImage(content.image);
        if (content.thumbnail) embed.setThumbnail(content.thumbnail);
        if (content.timestamp) embed.setTimestamp(content.timestamp === true ? undefined : content.timestamp);
        if (content.URL)       embed.setURL(content.URL)
    }
    return embed;
}

const guildPrefsCache: { [guildId: Snowflake]: GuildPreferences } = {};

export function prefs<T extends keyof GuildPreferences>(guildId: Snowflake, id: T) {
    if (!fs.existsSync(PREFS_DIR)) fs.mkdirSync(PREFS_DIR);
    if (guildPrefsCache[guildId] === undefined) guildPrefsCache[guildId] = {};

    const idFilename = `${id}.json`;

    function assertDir(path: string) {
        if (!fs.existsSync(path)) fs.mkdirSync(path);
    }

    return new class {
        public get(): GuildPreferences[T] {
            read:
            if (guildPrefsCache[guildId]![id] === undefined) {
                //? Updates cache too
                if (!fs.existsSync(path.join(PREFS_DIR, guildId, idFilename))) break read;
                guildPrefsCache[guildId]![id] = JSON.parse(fs.readFileSync(path.join(PREFS_DIR, guildId, idFilename)).toString());
            }
            return guildPrefsCache[guildId]![id];
        }
    
        public set(value: GuildPreferences[T]) {
            //? Updates cache too
            // this.get(); //? Unnecessary, because it's gonna be overridden 
            guildPrefsCache[guildId]![id] = value;
            assertDir(path.join(PREFS_DIR, guildId));
            fs.writeFileSync(path.join(PREFS_DIR, guildId, idFilename), JSON.stringify(guildPrefsCache[guildId]![id]!, undefined, 2));
        }
    };
}


export async function init(unauthClient = DEFAULT_CLIENT) {
    const clientPromise = new Promise<Client<true>>((resolve, reject) => {
        try {
            unauthClient.once("ready", resolve);
        } catch (err) {
            reject(err);
        }
    });

    unauthClient.login(token);
    
    const client = await clientPromise;
    console.log("bot online");
    await loadCommands(client);
    console.log(`bot ready -- ${Date()}`);

    return client;
}

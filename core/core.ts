import { Client, EmbedFieldData, Intents, MessageEmbed } from "discord.js";
import { token } from "../config.json"
import { loadCommands } from "./commandLoader";
import { Command, ReplyStatus, REPLY_STATUS } from "./types";

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

export type Literal = string | number | boolean | undefined | null | void | {};
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

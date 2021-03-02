import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { Collection, Message, MessageEmbed, MessageReaction, User } from "discord.js";
import { getCmdList } from "../commands";

const cmd: types.Command = {
    func: cmdReport,
    name: "report",
    adminCommand: false,
    usage: "report",
    // description: "",
    examples: [ "" ]
};

const MAX_DESC_LENGHT = 300;

const reactionOptions = [
    "1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣",
    "🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳", "🇴"
];

type OptionFunc = (data: types.Data) => TreeOption[] | true;
type TreeOption = [string, OptionFunc, string?];


const commandList = (data: types.Data): TreeOption[] => {
    const cmdNames = getCmdList().map(x => x.name);
    const commandOptions: TreeOption[] = cmdNames.map(x => [x, () => true]);
    const otherOptions:   TreeOption[] = [["other", () => true]];
    return [...commandOptions, ...otherOptions];
}

const optionsTree: TreeOption[] = [
    ["bot bug", commandList],
    ["other", () => true]
];

const neutralColor = 0x008888;

const loadingMsg = new MessageEmbed()
.setColor(neutralColor)
.setTitle("Loading...");


async function cmdReport({ data, msg }: types.CombinedData) {
    console.log(`${msg.author.username}#${msg.author.discriminator} started a report session`);
    await msg.channel.send(loadingMsg)
    .then(async sentMsg => {
        
        const problemPath = [ "report" ];

        let tree = optionsTree;
        let description = "Choose an option by clicking on the respective reaction.";
        while (true) {
            const answer = await createPoll(msg, sentMsg, tree, description, problemPath);
            if (answer === undefined) {
                sentMsg.edit(new MessageEmbed().setColor(0xbb0000).setTitle("Timed out..."));
                return;
            }
            
            const option = tree[answer];
            problemPath.push(option[0]);
            const selectedOption = option[1](data);
            description = option[2] ?? "";

            if (selectedOption === true) {
                sentMsg.edit(new MessageEmbed().setColor(neutralColor)
                    .setDescription(`Plese send some text further describing your problem.\n(max. ${MAX_DESC_LENGHT} characters)`)
                );

                const filter = (problemMsg: Message) => problemMsg.author.id === msg.author.id;

                const sendReport = async (collected: Collection<string, Message>) => {
                    const problemDescMsg = collected.first();
                    const owner = await Utilz.getBotOwner(data);
                    const problemString = problemDescMsg?.content?.slice(0, MAX_DESC_LENGHT)?.replace(/[ \t]+/g, " ")?.replace(/\n+/g, "    ");
                    const embed = new MessageEmbed()
                        .setColor(0xbb0000)
                        .setTitle(`${msg.author.username}#${msg.author.discriminator} reported a problem:`)
                        .setDescription(`**${msg.author}**\n\n**At:**\n\`${problemPath.join(" > ")}\`\n\n**With the description:**\n${problemString}`);
                    await owner.send(embed);

                    const replyEmbed = new MessageEmbed()
                        .setColor(0x00bb00)
                        .setTitle("Successfully reported your problem!")
                        .setDescription(`With the description: '${problemDescMsg?.content?.replace(/\s+/g, " ")}'`);
                    msg.channel.send(msg.author, replyEmbed);
                    sentMsg.delete();
                };

                await sentMsg.channel.awaitMessages(filter, {max: 1, time: 120000, errors: ["time"]})
                    .then(sendReport)
                    .catch(sendReport);
                break;
            }

            tree = selectedOption;
            sentMsg.edit(loadingMsg);
        }
        console.log(`ended report session with ${msg.author.username}#${msg.author.discriminator}`);

    }).catch(console.error);
}

async function createPoll(msg: Message, sentMsg: Message, tree: TreeOption[], desc: string, problemPath: string[]): Promise<number | undefined> {
    const options = tree.map(x => x[0]);
    const optionsAmount = options.length;
    const currentReactions = reactionOptions.slice(0, optionsAmount);
    await addReactions(sentMsg, currentReactions);
    
    const content = `${desc}\n\n`
        + options.reduce((a, b, i) => a + `${currentReactions[i]}   ${b}\n`, "");
    sentMsg.edit(new MessageEmbed().setColor(neutralColor).setTitle(`${Utilz.capitalize(problemPath[problemPath.length-1])}:`).setDescription(content));

    const filter = (reaction: MessageReaction, user: User) => currentReactions.includes(reaction.emoji.name) && user.id === msg.author.id
    
    try {
        const collected = await sentMsg.awaitReactions(filter, { max: 1, time: 60000, errors: ["time"] });
        sentMsg.reactions.removeAll().catch(console.error);

        const reaction = collected.first();
        if (reaction === undefined) return undefined;

        const reactionName = reaction.emoji.name;
        const reactionIdx = currentReactions.indexOf(reactionName);
        return reactionIdx;
    }
    catch (err) {
        sentMsg.reactions.removeAll().catch(console.error);
        return undefined;
    }
}

async function addReactions(msg: Message, reactions: string[], maxTries = 3) {
    try {
        for (const reaction of reactions) {
            await msg.react(reaction);
        }
    }
    catch (err) {
        if (maxTries === 0) return console.error(err);

        await msg.reactions.removeAll()
            .then(() => addReactions(msg, reactions, maxTries-1))
            .catch(console.error);
    }
}

module.exports = cmd;

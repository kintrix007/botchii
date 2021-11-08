import * as DC from "discord.js";
import * as fs from "fs";
const client = new DC.Client();
// just some hardcoded values
const lookCategoryId = "802545716923990016";
const targetChannelId = "809403993969000458";
const acceptEmojis = ["✅"];
const declineEmojis = ["❎", "❌"];
const sleepImage = "./botchii-asleep.png";
const awakeImage = "./botchii-awake.png";
const sleepAfterMs = 4 * 3600000; // 4 times one hour
let isAsleep = true;
let sleepTimeout;
async function main() {
    let lookChannelIds;
    client.on("ready", async () => {
        lookChannelIds = await updateLookChannels(lookCategoryId);
        console.log(lookChannelIds);
        // await setSleepState(true);
        cacheMessages(lookChannelIds);
        console.log("-- bot ready --");
    });
    client.on("channelCreate", async (channel) => {
        console.log(`made channel '#${channel.name}'`);
        lookChannelIds = await updateLookChannels(lookCategoryId);
    });
    client.on("channelDelete", async (channel) => {
        console.log(`deleted channel '#${channel.name}'`);
        lookChannelIds = lookChannelIds.filter(x => x !== channel.id);
    });
    client.on("messageReactionAdd", (reaction, user) => {
        if (lookChannelIds.includes(reaction.message.channel.id)) {
            reaction.message.channel.guild.members.fetch(user.id)
                .then(async (reactingMember) => {
                if (!reactingMember.hasPermission("MANAGE_GUILD")) { // only "mods" can use it
                    console.log(`${user.username}#${user.discriminator} doesn't have the required permission`);
                    return;
                }
                const reactionName = reaction._emoji.name;
                const isValidEmoji = acceptEmojis.includes(reactionName) || declineEmojis.includes(reactionName);
                if (!isValidEmoji)
                    return;
                const reactionObjects = reaction.message.reactions.cache.array();
                const [acceptCount, declineCount] = getAcceptDeclineCount(reactionObjects);
                const shouldResendMsg = acceptCount - 1 === Math.max(declineCount, 1);
                const trucanteToLength = 25;
                const rawCont = reaction.message.content.replace(/\n+/g, " ");
                const cont = rawCont.length > trucanteToLength ? `${rawCont.slice(0, trucanteToLength)}...` : rawCont;
                const reply = `> ${cont}\n\`✅ ${acceptCount}  :  ${declineCount} ❎\``;
                reaction.message.channel.send(reply);
                if (!shouldResendMsg)
                    return;
                wakeUp();
                const channel = await client.channels.fetch(targetChannelId);
                resendMessageIn(channel, reaction.message);
                const embed = new DC.MessageEmbed()
                    .setColor(0x00bb00)
                    .setDescription(`${user} accepted an announcement.`);
                reaction.message.channel.send(embed);
            })
                .catch(err => console.error("ERROR HAPPENED while getting reactingMember:\t" + err));
        }
    });
    loginBot();
}
function getAcceptDeclineCount(reactionArr) {
    const reactions = reactionArr.map(r => { return { name: r._emoji.name, amount: r.count }; });
    console.log(reactions);
    const acceptCount = reactions.filter(({ name }) => acceptEmojis.includes(name))
        .map(x => x.amount)
        .reduce((a, b) => a + b, 0);
    const declineCount = reactions.filter(({ name }) => declineEmojis.includes(name))
        .map(x => x.amount)
        .reduce((a, b) => a + b, 0);
    return [acceptCount, declineCount];
}
// goes to sleep after a certain amount of time automatically
function wakeUp() {
    if (sleepTimeout)
        clearTimeout(sleepTimeout);
    setSleepState(false).then(() => {
        sleepTimeout = setTimeout(setSleepState, sleepAfterMs, true); // true is asleep
    });
}
async function setSleepState(newIsAsleep) {
    console.log("current | requested:\t", isAsleep, "|", newIsAsleep);
    if (newIsAsleep === isAsleep)
        return;
    try {
        console.log(`requesting sleep state: '${newIsAsleep ? "asleep zzzz" : "awake!"}'`);
        await client.user.setAvatar(newIsAsleep ? sleepImage : awakeImage);
        // client.user.setPresence({status: "idle"});
        isAsleep = newIsAsleep;
        console.log(`botchii is now: '${isAsleep ? "asleep zzzz" : "awake!"}'`);
    }
    catch (err) {
        console.error("ERROR HAPPENED:\t" + err);
    }
}
function resendMessageIn(channel, message) {
    const forwardMessage = ((msgAuthorMember) => {
        const attachments = message.attachments.array();
        console.log("attachments count:\t", attachments.length);
        const announcerName = msgAuthorMember?.nickname ?? message.author.username;
        const messageContent = `**${announcerName + (msgAuthorMember ? " announced" : "")}:**\n`
            + message.content.replace(/@everyone/g, "`@`everyone").replace(/@here/g, "`@`here");
        if (attachments.length)
            channel.send(messageContent, ...attachments);
        else
            channel.send(messageContent);
        console.log("copied a message");
    });
    message.channel.guild.members.fetch(message.author.id)
        .then((authorMember) => forwardMessage(authorMember)) // prepend nickname or username
        .catch((err) => forwardMessage(null)); // prepend username, since member does not exist
}
function cacheMessages(channelIds) {
    channelIds.forEach(channelId => {
        client.channels.fetch(channelId)
            .then((channel) => {
            channel.messages.fetch(); // cache all messages in channel
        })
            .catch((err) => console.log("ERROR HAPPENED:\t" + err));
    });
}
function loginBot() {
    client.login(fs.readFileSync("token.token", "ascii"));
}
async function updateLookChannels(CategoryId) {
    const lookCategory = await client.channels.fetch(CategoryId);
    return lookCategory.guild.channels.cache.array().filter(x => x.parentID === CategoryId).map(x => x.id);
}
main();

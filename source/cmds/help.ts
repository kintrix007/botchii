import * as Utilz from "../classes/utilz";
import * as types from "../classes/types";
import { getCmdList } from "../commands";
import { MessageEmbed } from "discord.js";

const cmd: types.Command = {
    func: cmdHelp,
    name: "help",
    group: "help",
    aliases: [ "segítség" ],
    usage: "help [parancs neve]",
    description: "Megadja egy parancs használati módját, leírását, és mutat néhány pédát.",
    examples: [ "", "órarend", "követkető" ]
};

const footerNote = "A [] helyén egy paraméter opcionálisan megadható,\nA <> helyén pedig egy paraméter kötelező.";

function cmdHelp({ data, msg, args }: types.CombinedData) {
    const targetCommand = args[0];
    const currentPrefix = Utilz.getPrefix(data, msg.guild!);
    
    const isMemberAdmin = Utilz.isAdmin(msg.member);
    const cmdList = getCmdList(!isMemberAdmin);

    if (targetCommand) {
        // query specific help sheet
        const command = cmdList.find(x => Utilz.removeAccents(x.name.toLowerCase()) === targetCommand
            || x.aliases?.map(x => Utilz.removeAccents(x.toLowerCase()))?.includes(targetCommand));
        if (!command) {
            const embed = new MessageEmbed()
                .setColor(0xbb0000)
                .setDescription(`Nem létezik \`${targetCommand}\` nevű parancs.`);
            msg.channel.send(embed);
            return;
        }
        const usage = "`" + currentPrefix + command.usage! + "`";
        const commandName = currentPrefix + command.name;
        const aliases = (command.aliases ? "alias: " + command.aliases.map(x => currentPrefix+x).reduce((a, b) => a + ", " + b) : "");
        const description = command.description || "**[Nincs hozzáadva leírás]**";
        const examples = (command.examples ? "**Pl.:  " +
            command.examples.map(x => x ? `\`${commandName} ${x}\`` : `\`${commandName}\``) 
                            .reduce((a, b) => a + ", " + b) + "**"
        : "");

        const reply = description + "\n\n" + examples;
        const embed = new MessageEmbed()
            .setColor(0x00bb00)
            .setTitle(usage)
            .setDescription(reply)
            .setFooter(aliases);
        
        msg.channel.send(embed);
        console.log(`${msg.author.username}#${msg.author.discriminator} queried the help sheet for '${targetCommand}'`);

    } else {
        // query general help sheet
        const commandsInGroups: {[K in types.CommandGroup]?: types.Command[]} = {};
        cmdList.forEach(command => {
            const group = command.group ?? "";
            if (commandsInGroups[group] === undefined) {
                commandsInGroups[group] = [];
            }
            commandsInGroups[group]!.push(command);
        });

        const commandsAssocList = (Object.entries(commandsInGroups)
            .filter(([,commands]) => commands != undefined) as [types.CommandGroup, types.Command[]][])
            .sort()
            .sort(([groupA], [groupB]) => {
                if (groupA === "help" && groupB !== "help") return -1;
                if (groupB === "help" && groupA !== "help") return 1;
                return 0;
            });

        const reply = "```\n"
            + commandsAssocList.reduce((acc, [group, commands]) => {
                const isValidGroup = group && group !== "help"; 
                return acc + (isValidGroup ? "```\n**" + Utilz.capitalize(group) + ":**\n```" : "")
                    + commands.reduce((acc, command) => acc + currentPrefix + command.usage! + "\n", "");
            }, "") + "```";
        
        const embed = new MessageEmbed()
            .setColor(0x00bb00)
            .setTitle("**Help:**")
            .setDescription(reply)
            .setFooter(footerNote);

        msg.channel.send(embed);
        console.log(`${msg.author.username}#${msg.author.discriminator} queried the general help sheet`);
    }
}

module.exports = cmd;

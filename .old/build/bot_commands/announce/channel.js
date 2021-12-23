"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("../../_core/bot_core");
const set_channel_1 = __importDefault(require("./set_channel"));
const get_channel_1 = __importDefault(require("./get_channel"));
const description = `Lets you set the default announce target and the channels where they will be sent from.
The base channels are where the bot is allowed to announce messages from.
The target channels are what botchii defaults to when using the \`announce\` command.`;
exports.default = {
    call: cmdChannel,
    name: "channel",
    permissions: [bot_core_1.adminPermission],
    group: "announcement",
    aliases: ["channels"],
    usage: [
        "channel <from|base> <channels...>",
        "channel <to|target> <channels...>"
    ],
    description: description,
    examples: [[], ["alias"], ["alias", "general", "123456789012345678"], ["from", "#announcements"], ["to", "general", "#memes"]],
};
function cmdChannel(cmdCall) {
    return __awaiter(this, void 0, void 0, function* () {
        const { coreData, msg, args } = cmdCall;
        const mode = args[0];
        if (mode === undefined) {
            yield get_channel_1.default(cmdCall);
            return;
        }
        const subCmdCall = {
            msg, coreData,
            cmdName: mode,
            args: args.slice(1),
            argsStr: args.slice(1).join(" "),
            cont: args.join(" ")
        };
        if (["from", "base"].includes(mode)) {
            yield set_channel_1.default(subCmdCall, "base");
        }
        else if (["to", "target"].includes(mode)) {
            yield set_channel_1.default(subCmdCall, "target");
        }
        else {
            bot_core_1.sendEmbed(msg, "error", `\`${mode}\` is not a valid arguement for \`channel\`!`);
        }
    });
}

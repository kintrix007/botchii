"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.createCmdsListeners = exports.addDefaultCommands = exports.defaultCmdNames = exports.cmds = void 0;
const listeners_1 = require("../listeners");
const bot_utils_1 = require("../utils/bot_utils");
const commands_1 = require("../commands");
const dc_utils_1 = require("../utils/dc_utils");
const general_utils_1 = require("../utils/general_utils");
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const limit_utils_1 = require("./limit_utils");
const DEAULT_NOT_PERMITTED_ERROR_MESSAGE = ({ cmdName }) => `You do not have permission to use the command \`${cmdName}\`.`;
exports.cmds = [];
exports.defaultCmdNames = [];
function addDefaultCommands(cmdNames) {
    cmdNames.forEach(x => exports.defaultCmdNames.push(x));
}
exports.addDefaultCommands = addDefaultCommands;
function createCmdsListeners(coreData, cmdDirs) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.allSettled(cmdDirs.map(loadCmds)).catch(console.error);
        yield setupCmds(coreData);
        listeners_1.addListener(coreData.client, "message", (msg) => __awaiter(this, void 0, void 0, function* () {
            if (msg.author.bot)
                return;
            if (!dc_utils_1.isMessageChannel(msg.channel))
                return;
            if (msg.channel instanceof discord_js_1.DMChannel)
                return;
            let cmd = undefined;
            let cmdCall = undefined;
            if (bot_utils_1.isOnlyBotPing(msg)) {
                for (const cmdName of exports.defaultCmdNames) {
                    const command = commands_1.getCmd(cmdName, false);
                    if (command === undefined)
                        continue;
                    const commandCall = {
                        coreData, msg,
                        cmdName: command.name,
                        args: [],
                        argsStr: "",
                    };
                    if (allPermsPass(command, commandCall)) {
                        cmd = command;
                        cmdCall = commandCall;
                        break;
                    }
                }
            }
            else {
                cmdCall = commands_1.getCmdCallData(coreData, msg);
                if (cmdCall === undefined)
                    return;
                cmd = commands_1.getCmd(cmdCall.cmdName, false);
            }
            if (cmd === undefined)
                return;
            if (!limit_utils_1.isInsideLimit({ msg: cmdCall.msg, cmd: cmd }))
                return;
            executeCommand(msg, cmd, cmdCall);
        }));
        console.log("-- all message listeners set up --");
    });
}
exports.createCmdsListeners = createCmdsListeners;
function allPermsPass(cmd, cmdCall) {
    var _a;
    return !((_a = cmd.permissions) === null || _a === void 0 ? void 0 : _a.some(({ test }) => !test(cmdCall)));
}
function executeCommand(msg, cmd, cmdCall) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const failingPermission = (_a = cmd.permissions) === null || _a === void 0 ? void 0 : _a.find(({ test }) => !test(cmdCall));
        if (failingPermission !== undefined) {
            const errorMessage = (_c = (_b = failingPermission.errorMessage) === null || _b === void 0 ? void 0 : _b.call(failingPermission, cmdCall)) !== null && _c !== void 0 ? _c : DEAULT_NOT_PERMITTED_ERROR_MESSAGE(cmdCall);
            dc_utils_1.sendEmbed(msg, "error", errorMessage);
            return;
        }
        const cmdRes = yield cmd.call(cmdCall);
        if (cmdRes == null)
            return;
        console.log(`'${cmd.name}' called in '${msg.guild.name}' by user '${dc_utils_1.getUserString(msg.author)}' <@${msg.author.id}>`);
        const embedOrString = (cmdRes instanceof Function ? cmdRes(msg) : cmdRes);
        const botMember = msg.guild.member(msg.client.user);
        const target = (botMember === null || botMember === void 0 ? void 0 : botMember.hasPermission("SEND_MESSAGES")) ? msg.channel : msg.author;
        target.send(embedOrString).catch(err => {
            if (embedOrString instanceof discord_js_1.MessageEmbed && err instanceof discord_js_1.DiscordAPIError && !(target instanceof discord_js_1.User)) {
                target.send(dc_utils_1.embedToString(embedOrString));
            }
        });
    });
}
function setupCmds(coreData) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("-- started setting up commands... --");
        const setupPromises = exports.cmds.map(({ setup }) => setup === null || setup === void 0 ? void 0 : setup(coreData));
        yield Promise.allSettled(setupPromises);
        console.log("-- finished setting up commands --");
    });
}
function loadCmds(cmdDir) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`-- loading commands from '${path_1.default.basename(cmdDir)}'... --`);
        const withoutExt = (filename) => filename.slice(0, filename.length - path_1.default.extname(filename).length);
        const filenames = fs_1.default.readdirSync(cmdDir)
            .filter(filename => !fs_1.default.lstatSync(path_1.default.join(cmdDir, filename)).isDirectory())
            .map(withoutExt);
        const importPromieses = filenames.map((filename) => {
            const cmdPath = path_1.default.join(cmdDir, filename);
            return Promise.resolve().then(() => __importStar(require(cmdPath)));
        });
        function hasDefault(obj) {
            return typeof obj === "object" && obj != null && typeof obj.default === "object" && obj.default != null;
        }
        const _imports = yield Promise.allSettled(importPromieses).catch(console.error);
        if (_imports == null)
            return;
        const imported = _imports.map(x => x.status === "fulfilled" ? x.value : undefined).filter(general_utils_1.notOf(undefined));
        const falied = _imports.map(x => x.status === "rejected" ? x.reason : undefined).filter(general_utils_1.notOf(undefined));
        if (falied.length !== 0)
            console.error(falied);
        const commands = imported.map(x => hasDefault(x) ? x.default : x).filter(bot_utils_1.isCommand);
        commands.forEach(createCmd);
    });
}
function createCmd(command) {
    var _a;
    console.log(`command created: '${command.name}'`);
    const convertedCommand = Object.assign(Object.assign({}, command), { name: bot_utils_1.impl.applyMessageContentModifiers(command.name), aliases: (_a = command.aliases) === null || _a === void 0 ? void 0 : _a.map(alias => bot_utils_1.impl.applyMessageContentModifiers(alias)) });
    exports.cmds.push(convertedCommand);
}

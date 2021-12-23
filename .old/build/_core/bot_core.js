"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
exports.initBot = exports.deleteListener = exports.addListener = exports.getPermittedCmdList = exports.getCmdList = exports.getCmdCallData = exports.getCmd = void 0;
const bot_utils_1 = require("./utils/bot_utils");
const command_loader_1 = require("./impl/command_loader");
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
__exportStar(require("./types"), exports);
__exportStar(require("./utils/bot_utils"), exports);
__exportStar(require("./utils/general_utils"), exports);
__exportStar(require("./utils/dc_utils"), exports);
__exportStar(require("./utils/alias_utils"), exports);
var commands_1 = require("./commands");
Object.defineProperty(exports, "getCmd", { enumerable: true, get: function () { return commands_1.getCmd; } });
Object.defineProperty(exports, "getCmdCallData", { enumerable: true, get: function () { return commands_1.getCmdCallData; } });
Object.defineProperty(exports, "getCmdList", { enumerable: true, get: function () { return commands_1.getCmdList; } });
Object.defineProperty(exports, "getPermittedCmdList", { enumerable: true, get: function () { return commands_1.getPermittedCmdList; } });
var listeners_1 = require("./listeners");
Object.defineProperty(exports, "addListener", { enumerable: true, get: function () { return listeners_1.addListener; } });
Object.defineProperty(exports, "deleteListener", { enumerable: true, get: function () { return listeners_1.deleteListener; } });
;
const DEFAULT_PREFIX = "!";
const DEFAULT_COMMANDS_DIR = path_1.default.join(bot_utils_1.BOT_CORE_DIR, "default_commands");
function initBot(customCoreData, setupData) {
    return __awaiter(this, void 0, void 0, function* () {
        const { commandDirs, defaultPrefix = DEFAULT_PREFIX, defaultCommands = [], messageContentModifiers = [], options, onready, } = setupData;
        // impl.checkConfigErorrs();
        bot_utils_1.impl.defaultPrefix = defaultPrefix;
        bot_utils_1.impl.messageContentModifiers = messageContentModifiers;
        command_loader_1.addDefaultCommands(defaultCommands);
        const client = new discord_js_1.Client();
        if (options !== undefined) {
            const entries = Object.entries(options);
            entries.forEach(([key, value]) => {
                client.options[key] = value;
            });
        }
        const normalizedCommandDirs = commandDirs.map(dir => path_1.default.normalize(dir));
        client.on("ready", () => __awaiter(this, void 0, void 0, function* () {
            console.log("-- bot online --");
            const coreData = Object.assign({ client: client, defaultPrefix }, customCoreData);
            yield command_loader_1.createCmdsListeners(coreData, [DEFAULT_COMMANDS_DIR, ...normalizedCommandDirs]);
            console.log("-- bot setup complete --");
            console.log("-- bot ready --");
            const guilds = Array.from(coreData.client.guilds.cache.values());
            console.log(`Online in ${guilds.length} guild${guilds.length === 1 ? '' : 's'}:`, guilds.map(x => x.name));
            onready === null || onready === void 0 ? void 0 : onready(coreData);
        }));
        console.log("-- authenticating bot... --");
        yield loginBot(client);
    });
}
exports.initBot = initBot;
function loginBot(client) {
    const token = bot_utils_1.impl.botToken;
    return client.login(token);
}

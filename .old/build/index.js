"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("./_core/bot_core");
const path_1 = __importDefault(require("path"));
bot_core_1.initBot({}, {
    defaultPrefix: ".",
    messageContentModifiers: [
        x => x.toLowerCase(),
    ],
    commandDirs: [
        path_1.default.join(__dirname, "bot_commands", "announce"),
    ],
    defaultCommands: ["announce", "help"],
    options: {
        disableMentions: "everyone",
    },
    onready: data => {
        console.log(`Current time: ${Date()}`);
    },
});

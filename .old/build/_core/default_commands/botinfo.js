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
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("../bot_core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.default = {
    call: cmdInfo,
    name: "botinfo",
    usage: "botinfo",
    group: "help",
    description: "Shows some basic information about the bot.",
    examples: [[]]
};
function cmdInfo({ msg }) {
    const packagePath = path.join(bot_core_1.ROOT_DIR, "package.json");
    const packageObj = JSON.parse(fs.readFileSync(packagePath).toString());
    const name = bot_core_1.capitalize(packageObj.name);
    const description = packageObj.description;
    const homepage = packageObj.homepage;
    return bot_core_1.createEmbed("neutral", {
        title: name,
        desc: description + (homepage ? "\n**GitHub: **" + homepage : "")
    });
}

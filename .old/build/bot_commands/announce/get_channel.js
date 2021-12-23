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
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("../../_core/bot_core");
const command_prefs_1 = require("../command_prefs");
function cmdGetChannel({ msg }) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const channelPrefs = bot_core_1.loadPrefs(command_prefs_1.CHANNEL_PREFS_FILE);
        const channelData = channelPrefs[msg.guild.id];
        const fromChannelStrings = (_b = (_a = channelData === null || channelData === void 0 ? void 0 : channelData.fromChannels) === null || _a === void 0 ? void 0 : _a.map(x => "<#" + x + ">").join(", ")) !== null && _b !== void 0 ? _b : "None set...";
        const toChannelStrings = (_d = (_c = channelData === null || channelData === void 0 ? void 0 : channelData.toChannels) === null || _c === void 0 ? void 0 : _c.map(x => "<#" + x + ">").join(", ")) !== null && _d !== void 0 ? _d : "None set...";
        bot_core_1.sendEmbed(msg, "neutral", {
            title: "Channels",
            desc: `base: ${fromChannelStrings}\ntarget: ${toChannelStrings}`
        });
    });
}
exports.default = cmdGetChannel;

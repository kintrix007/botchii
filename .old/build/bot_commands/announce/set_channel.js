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
function cmdSetChannel({ msg, args }, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        const channels = yield bot_core_1.fetchTextChannels(msg.client, bot_core_1.parseChannels(msg.guild, args));
        if (channels.length === 0) {
            bot_core_1.sendEmbed(msg, "error", "No valid channels given.");
            return;
        }
        const channelData = (() => {
            var _a, _b;
            switch (mode) {
                case "base": {
                    const channelData = {
                        [msg.guild.id]: Object.assign(Object.assign({}, ((_a = bot_core_1.loadPrefs(command_prefs_1.CHANNEL_PREFS_FILE, true)[msg.guild.id]) !== null && _a !== void 0 ? _a : {})), { guildName: msg.guild.name, fromChannels: channels.map(x => x.id) })
                    };
                    return channelData;
                }
                case "target": {
                    const channelData = {
                        [msg.guild.id]: Object.assign(Object.assign({}, ((_b = bot_core_1.loadPrefs(command_prefs_1.CHANNEL_PREFS_FILE, true)[msg.guild.id]) !== null && _b !== void 0 ? _b : {})), { guildName: msg.guild.name, toChannels: channels.map(x => x.id) })
                    };
                    return channelData;
                }
            }
        })();
        bot_core_1.updatePrefs(command_prefs_1.CHANNEL_PREFS_FILE, channelData);
        bot_core_1.sendEmbed(msg, "ok", {
            title: `Succesfully set ${mode} channel${channels.length === 1 ? '' : 's'}!`,
            desc: `channels: ${channels.join(", ")}`
        });
    });
}
exports.default = cmdSetChannel;

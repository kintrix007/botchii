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
exports.outersection = exports.difference = exports.intersection = exports.union = exports.convertToUserReactions = exports.convertToCountedEmoji = exports.PICS_DIR = void 0;
const bot_core_1 = require("./_core/bot_core");
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
exports.PICS_DIR = path_1.default.join(bot_core_1.ROOT_DIR, "images");
function convertToCountedEmoji(reaction) {
    const { emoji, count } = reaction;
    const users = Array.from(reaction.users.cache.values());
    const isCustom = emoji instanceof discord_js_1.GuildEmoji;
    const counted = {
        isCustom,
        string: (isCustom ? `<:${emoji.name}:${emoji.id}>` : emoji.name),
        count: count !== null && count !== void 0 ? count : 0,
        users,
        isInvalid: isCustom && emoji.id === null || !isCustom && emoji.id !== null || count === null || count === 0
    };
    return counted;
}
exports.convertToCountedEmoji = convertToCountedEmoji;
function convertToUserReactions(reactions, fromCache = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fromCache)
            yield Promise.all(reactions.map(x => x.users.fetch()));
        let userReactions = {};
        reactions.forEach(reaction => {
            const users = Array.from(reaction.users.cache.values());
            users.forEach(usr => {
                var _a;
                userReactions[usr.id] = new Set([...((_a = userReactions[usr.id]) !== null && _a !== void 0 ? _a : []), reaction.emoji.toString()]);
            });
        });
        return userReactions;
    });
}
exports.convertToUserReactions = convertToUserReactions;
function union(a, b) {
    return new Set([...a, ...b]);
}
exports.union = union;
function intersection(a, b) {
    return new Set([...a].filter(x => b.has(x)));
}
exports.intersection = intersection;
function difference(a, b) {
    return new Set([...a].filter(x => !b.has(x)));
}
exports.difference = difference;
function outersection(a, b) {
    return union(difference(a, b), difference(b, a));
}
exports.outersection = outersection;

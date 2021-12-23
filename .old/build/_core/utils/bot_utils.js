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
exports.updatePrefs = exports.loadPrefs = exports.savePrefs = exports.getPrefix = exports.isOnlyBotPing = exports.getBotOwner = exports.getBotOwnerID = exports.getAdminRole = exports.isBotOwner = exports.isAdmin = exports.createChannelSpecificCmdPermission = exports.createCommandPermission = exports.ownerPermission = exports.adminPermission = exports.isCommand = exports.impl = exports.PREFS_DIR = exports.SOURCE_DIR = exports.ROOT_DIR = exports.BOT_CORE_DIR = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const general_utils_1 = require("./general_utils");
const command_prefs_1 = require("../default_commands/command_prefs");
const discord_js_1 = require("discord.js");
const impl_1 = require("../impl/impl");
exports.BOT_CORE_DIR = path_1.default.join(__dirname, "..");
exports.ROOT_DIR = path_1.default.join(exports.BOT_CORE_DIR, "..", "..");
exports.SOURCE_DIR = path_1.default.join(exports.ROOT_DIR, "source");
exports.PREFS_DIR = path_1.default.join(exports.ROOT_DIR, "prefs");
exports.impl = new impl_1.Impl();
function isCommand(obj) {
    if (typeof obj !== "object")
        return false;
    if (obj == null)
        return false;
    function test(field, types) {
        return types.some(x => typeof field === x);
    }
    function testArray(field, arrayTypes) {
        if (!(field instanceof Array))
            return false;
        return field.every(x => test(x, arrayTypes));
    }
    function test2DArray(field, arrayTypes) {
        if (!(field instanceof Array))
            return false;
        return field.every(x => testArray(x, arrayTypes));
    }
    const { setup, call, name, aliases, permissions, group, usage, description, examples } = obj;
    return [
        test(setup, ["undefined", "function"]),
        test(call, ["function"]),
        test(name, ["string"]),
        test(aliases, ["undefined"]) || testArray(aliases, ["string"]),
        test(permissions, ["undefined", "object"]),
        test(group, ["undefined", "string"]),
        test(usage, ["undefined", "string"]) || testArray(usage, ["string"]),
        test(description, ["undefined", "string"]),
        test(examples, ["undefined"]) || test2DArray(examples, ["string"]),
    ].every(x => x);
}
exports.isCommand = isCommand;
exports.adminPermission = {
    test: ({ msg }) => isAdmin(msg.member),
    errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by admins.`,
    description: cmd => "Only people with the **admin role**, or with the **Administrator** permission can use this command.",
};
exports.ownerPermission = {
    test: ({ msg }) => isBotOwner(msg.author),
    errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by the bot's owner.`,
    description: cmd => "Only the bot's **owner** can use this command.",
};
function createCommandPermission(permission) {
    const humanReadablePermission = humanReadable(permission);
    const cmdPerm = {
        test: ({ msg }) => { var _a, _b; return (_b = (_a = msg.member) === null || _a === void 0 ? void 0 : _a.hasPermission(permission)) !== null && _b !== void 0 ? _b : false; },
        errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by people with **${humanReadablePermission}** permission.`,
        description: cmd => `Only people with **${humanReadablePermission}** permission can use this command.`,
    };
    return cmdPerm;
}
exports.createCommandPermission = createCommandPermission;
function createChannelSpecificCmdPermission(permission) {
    const humanReadablePermission = humanReadable(permission);
    const cmdPerm = {
        test: ({ msg }) => {
            var _a;
            const channel = msg.channel;
            if (channel instanceof discord_js_1.DMChannel)
                return true;
            if (msg.member === null)
                return false;
            const perms = channel.permissionsFor(msg.member);
            return (_a = perms === null || perms === void 0 ? void 0 : perms.has(permission)) !== null && _a !== void 0 ? _a : false;
        },
        errorMessage: ({ cmdName }) => `You can only use \`${cmdName}\` if you have **${humanReadablePermission}** in this channel!`,
        description: cmd => `Only people, who have **${humanReadablePermission}** permission in a given channel, can use this command.`,
    };
    return cmdPerm;
}
exports.createChannelSpecificCmdPermission = createChannelSpecificCmdPermission;
function isAdmin(member) {
    if (!member)
        return false;
    const adminRole = getAdminRole(member.guild.id);
    return member.roles.cache.some(role => role.id === (adminRole === null || adminRole === void 0 ? void 0 : adminRole.roleID)) || member.hasPermission("ADMINISTRATOR");
}
exports.isAdmin = isAdmin;
function isBotOwner(user) {
    return user.id === exports.getBotOwnerID();
}
exports.isBotOwner = isBotOwner;
function getAdminRole(guildID) {
    const adminRoles = loadPrefs(command_prefs_1.ADMIN_PREFS_FILE, true);
    const adminRole = adminRoles[guildID];
    return adminRole;
}
exports.getAdminRole = getAdminRole;
const getBotOwnerID = () => exports.impl.ownerID;
exports.getBotOwnerID = getBotOwnerID;
function getBotOwner(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const ownerID = exports.impl.ownerID;
        return yield data.client.users.fetch(ownerID); // returns a Promise
    });
}
exports.getBotOwner = getBotOwner;
function isOnlyBotPing(msg) {
    const cont = msg.content;
    const regex = new RegExp(`^\s*<@!?${msg.client.user.id}>\s*$`, "i");
    return regex.test(cont);
}
exports.isOnlyBotPing = isOnlyBotPing;
function getPrefix(guildID) {
    var _a;
    const prefixes = loadPrefs(command_prefs_1.PREFIX_PREFS_FILE, true);
    const prefixData = (_a = prefixes[guildID]) !== null && _a !== void 0 ? _a : { prefix: exports.impl.defaultPrefix };
    return prefixData.prefix;
}
exports.getPrefix = getPrefix;
function savePrefs(filename, saveData, silent = false) {
    if (!fs_1.default.existsSync(exports.PREFS_DIR)) {
        fs_1.default.mkdirSync(exports.PREFS_DIR);
        console.log(`created dir '${exports.PREFS_DIR}' because it did not exist`);
    }
    const filePath = path_1.default.join(exports.PREFS_DIR, filename + ".json");
    fs_1.default.writeFileSync(filePath, JSON.stringify(saveData, undefined, 2));
    if (!silent)
        console.log(`saved prefs in '${filename}'`);
}
exports.savePrefs = savePrefs;
/** returns {} if the given prefs file does not exist */
function loadPrefs(filename, silent = false) {
    if (!fs_1.default.existsSync(exports.PREFS_DIR)) {
        fs_1.default.mkdirSync(exports.PREFS_DIR);
        console.log(`created dir '${exports.PREFS_DIR}' because it did not exist`);
    }
    const filePath = path_1.default.join(exports.PREFS_DIR, filename + ".json");
    if (!fs_1.default.existsSync(filePath))
        return {};
    const loadDataRaw = fs_1.default.readFileSync(filePath).toString();
    const loadData = JSON.parse(loadDataRaw);
    if (!silent)
        console.log(`loaded prefs from '${filename}'`);
    return loadData;
}
exports.loadPrefs = loadPrefs;
/**
 * Overwrites a part of the prefs file.
 * Where the keys overlap, it saves the data from `overwriteData`,
 * otherwise the data from the JSON prefs file.
 * Since the keys are always the guildID's it makes it easier to update the prefs for a single guild.
*/
function updatePrefs(filename, overwriteData, silent = false) {
    const newPrefs = Object.assign(Object.assign({}, loadPrefs(filename, true)), overwriteData);
    savePrefs(filename, newPrefs, true);
    if (!silent)
        console.log(`updated prefs in '${filename}'`);
}
exports.updatePrefs = updatePrefs;
// local Utility
function humanReadable(perm) {
    const words = perm.toLowerCase().split("_");
    return words.map(general_utils_1.capitalize).join(" ");
}

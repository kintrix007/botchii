"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCalledBy = exports.getPermittedCmdList = exports.getCmdList = exports.getCmdCallData = exports.getCmd = void 0;
const bot_core_1 = require("./bot_core");
const dc_utils_1 = require("./utils/dc_utils");
const command_loader_1 = require("./impl/command_loader");
const limit_utils_1 = require("./impl/limit_utils");
// "public API"
function getCmd(cmdName, onlyCommandsWithUsage) {
    return getCmdList(onlyCommandsWithUsage).find(cmd => isCalledBy(cmd, cmdName));
}
exports.getCmd = getCmd;
function getCmdCallData(coreData, msg) {
    if (!dc_utils_1.isMessageChannel(msg.channel))
        return undefined;
    if (msg.author.bot)
        return undefined;
    const contTemp = bot_core_1.impl.prefixless(msg);
    if (contTemp === undefined)
        return undefined;
    const cont = bot_core_1.impl.applyMessageContentModifiers(contTemp);
    const splits = cont.trim().split(/\s+/);
    if (splits.length === 0)
        return undefined;
    const [commandName, ...args] = splits;
    const cmdCall = {
        coreData: coreData,
        msg: msg,
        cmdName: commandName,
        args: args,
        argsStr: args.join(" ")
    };
    return cmdCall;
}
exports.getCmdCallData = getCmdCallData;
function getCmdList(onlyCommandsWithUsage = true) {
    return command_loader_1.cmds.filter(x => !onlyCommandsWithUsage || !!x.usage);
}
exports.getCmdList = getCmdList;
function getPermittedCmdList(cmdCall) {
    const hasPerms = (x) => { var _a; return !((_a = x.permissions) === null || _a === void 0 ? void 0 : _a.some(({ test }) => !test(cmdCall))); };
    return getCmdList().filter(cmd => hasPerms(cmd) && limit_utils_1.isInsideLimit({ msg: cmdCall.msg, cmd: cmd }));
}
exports.getPermittedCmdList = getPermittedCmdList;
function isCalledBy(cmd, cmdName) {
    var _a, _b;
    return cmd.name == cmdName || ((_b = (_a = cmd.aliases) === null || _a === void 0 ? void 0 : _a.includes(cmdName)) !== null && _b !== void 0 ? _b : false);
}
exports.isCalledBy = isCalledBy;

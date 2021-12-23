"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_core_1 = require("../../_core/bot_core");
const description = ``;
exports.default = {
    call: cmdSetPermission,
    name: "setPermission",
    permissions: [bot_core_1.adminPermission],
    group: "admin",
    aliases: ["permission", "perm"],
    usage: "setPermission <Permission> <enable|inherit|disable> for <Users...> in <Channels...>",
    description: description,
    examples: []
};
function cmdSetPermission({}) {
}

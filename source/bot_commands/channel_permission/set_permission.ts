import { adminPermission, Command, CommandCallData } from "../../_core/bot_core";

const description = ``;

export default <Command>{
    call: cmdSetPermission,
    name: "setPermission",
    permissions: [ adminPermission ],
    group: "admin",
    aliases: [ "permission", "perm" ],
    usage: "setPermission <Permission> <enable|inherit|disable> for <Users...> in <Channels...>",
    description: description,
    examples: []
};

function cmdSetPermission({}: CommandCallData) {

}

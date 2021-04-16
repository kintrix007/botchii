import * as CoreTools from "../_core/core_tools";
import * as types from "../_core/types";
import { RR_PREFS_FILE, RRData } from "./reaction_roles";

const cmd: types.Command = {
    setupFunc: setupFunc,
    func: () => 0,
    name: "assignroles"
};

async function setupFunc({ client }: types.Data) {
    const rrData: RRData | undefined = RR_PREFS_FILE ? CoreTools.loadPrefs(RR_PREFS_FILE) : undefined;
}

module.exports = cmd;

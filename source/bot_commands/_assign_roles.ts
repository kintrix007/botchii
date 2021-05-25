import * as CoreTools from "../_core/core_tools";
import * as types from "../_core/types";
import { RR_PREFS_FILE, RRData } from "./command_prefs";

const cmd: types.Command = {
    setupFunc: setupFunc,
    func: () => {},
    name: "assignroles"
};

async function setupFunc({ client }: types.Data) {
    const rrData = CoreTools.loadPrefs<RRData>(RR_PREFS_FILE);
}

module.exports = cmd;

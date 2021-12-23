import { CommandCallData } from "../../_core/bot_core";
export default function cmdSetChannel({ msg, args }: CommandCallData, mode: "base" | "target"): Promise<void>;

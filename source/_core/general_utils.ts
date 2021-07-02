import path from "path";

export const BOT_CORE_DIR         = path.join(__dirname);
export const DEFAULT_COMMANDS_DIR = path.join(BOT_CORE_DIR, "default_commands");
export const ROOT_DIR             = path.join(BOT_CORE_DIR, "..", "..");
export const SOURCE_DIR = path.join(ROOT_DIR, "source");
export const PREFS_DIR  = path.join(ROOT_DIR, "prefs");


// general utility

export async function keepFulfilledResults<T>(arr: Promise<T>[]): Promise<T[]> {
    return (await Promise.allSettled(arr))
    .filter(<T>(x: PromiseSettledResult<T>): x is PromiseFulfilledResult<T> => x.status === "fulfilled")
    .map(({ value }) => value);
}

export function filterOut<T, U extends T>(arr: Array<T>, value: U) {
    return arr.filter((x): x is Exclude<T, U> => x !== value)
}

/** Capitalizes the first character of a string */
export function capitalize(str: string): string {
    if (str.length === 0) return "";
    return str[0]!.toUpperCase() + str.slice(1);
}

export function removeDuplicatesBy<T>(arr: T[], isEqual: (a: T, b: T) => boolean = (a, b) => a === b): T[] {
    return arr.filter((x, idx) => {
        const foundIdx = arr.findIndex(a => isEqual(x, a));
        return foundIdx === idx || foundIdx === -1;
    });
}

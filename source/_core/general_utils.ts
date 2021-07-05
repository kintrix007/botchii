export async function keepFulfilledResults<T>(arr: Promise<T>[]): Promise<T[]> {
    return (await Promise.allSettled(arr))
    .filter(<T>(x: PromiseSettledResult<T>): x is PromiseFulfilledResult<T> => x.status === "fulfilled")
    .map(({ value }) => value);
}

export function notOf<T>(excluded: T | T[] | Set<T>) {
    type CheckFunc = <U>(x: T | U) => x is Exclude<U, T>;
    if (excluded instanceof Set) {
        return <CheckFunc>(x => !excluded.has(x as T));
    } else if (excluded instanceof Array) {
        return <CheckFunc>(x => !excluded.includes(x as T));
    } else {
        return <CheckFunc>(x => excluded !== x);
    }
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

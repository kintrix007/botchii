/**
 * Returns a tuple of `[fulfilled, rejected]` promises.
 */
export declare function awaitAll<T>(promises: Promise<T>[]): Promise<[T[], any[]]>;
export declare function notOf<T>(excluded: T | T[] | Set<T>): <U>(x: T | U) => x is Exclude<U, T>;
/** Capitalizes the first character of a string */
export declare function capitalize(str: string): string;
export declare function removeDuplicatesBy<T>(arr: T[], isEqual?: (a: T, b: T) => boolean): T[];

import { Client, ClientEvents } from "discord.js";
declare type Listeners = {
    [K in keyof ClientEvents]?: Array<(...args: ClientEvents[K]) => void>;
};
declare type ListenerFunction<T extends keyof Listeners> = NonNullable<Listeners[T]>[number];
export declare function addListener<T extends keyof Listeners>(client: Client, event: T, listener: ListenerFunction<T>): void;
export declare function deleteListener<T extends keyof Listeners>(event: T, listener: ListenerFunction<T>): boolean;
export {};

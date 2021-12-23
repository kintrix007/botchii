import { Client, ClientEvents } from "discord.js";

type Listeners = {
    [K in keyof ClientEvents]?: Array<(...args: ClientEvents[K]) => void>
};

type ListenerFunction<T extends keyof Listeners> = NonNullable<Listeners[T]>[number];


let listeners: Listeners = {};


export function addListener<T extends keyof Listeners>(client: Client, event: T, listener: ListenerFunction<T>) {
    const eventAlreadyExists = event in listeners;
    if (listeners[event] === undefined) listeners[event] = [];
    listeners[event]!.push(listener as any);
    if (!eventAlreadyExists) createListener(client, event);
}

export function deleteListener<T extends keyof Listeners>(event: T, listener: ListenerFunction<T>) {
    const eventExists = event in listeners;
    if (!eventExists) return false;
    const idx = listeners[event]!.findIndex(x => x === listener);
    if (idx === -1) return false;
    delete listeners[event]![idx];
    return true;
}

function createListener(client: Client, event: keyof Listeners) {
    client.on(event, (...args) => {
        const callbacks = listeners[event] as Function[];
        callbacks.forEach(x => x(...args));
    });
}

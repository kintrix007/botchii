import { Client, ClientEvents } from "discord.js";

type Listeners = {
    [K in keyof ClientEvents]?: Array<(...args: ClientEvents[K]) => void>
};

type ListenerFunctionType<T extends keyof Listeners> = NonNullable<Listeners[T]>[0];


let listeners: Listeners = {};

export function addListener<T extends keyof Listeners>(client: Client, event: T, listener: ListenerFunctionType<T>) {
    const eventAlreadyExists = event in listeners;

    if (listeners[event] === undefined) listeners[event] = [];
    listeners[event]!.push(listener as any);
    
    if (!eventAlreadyExists) createListener(client, event);
}

export function overrideListener<T extends keyof Listeners>(client: Client, event: T, listener: ListenerFunctionType<T>) {
    const eventAlreadyExists = event in listeners;
    
    listeners[event] = [listener] as any[];
    
    if (!eventAlreadyExists) createListener(client, event);
}

function createListener(client: Client, event: keyof Listeners) {
    client.on(event, (...args) => {
        const callbacks = listeners[event] as Function[];
        callbacks.forEach(x => x(...args));
    });
}

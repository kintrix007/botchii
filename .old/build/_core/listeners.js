"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListener = exports.addListener = void 0;
let listeners = {};
function addListener(client, event, listener) {
    const eventAlreadyExists = event in listeners;
    if (listeners[event] === undefined)
        listeners[event] = [];
    listeners[event].push(listener);
    if (!eventAlreadyExists)
        createListener(client, event);
}
exports.addListener = addListener;
function deleteListener(event, listener) {
    const eventExists = event in listeners;
    if (!eventExists)
        return false;
    const idx = listeners[event].findIndex(x => x === listener);
    if (idx === -1)
        return false;
    delete listeners[event][idx];
    return true;
}
exports.deleteListener = deleteListener;
function createListener(client, event) {
    client.on(event, (...args) => {
        const callbacks = listeners[event];
        callbacks.forEach(x => x(...args));
    });
}

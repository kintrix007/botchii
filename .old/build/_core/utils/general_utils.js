"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDuplicatesBy = exports.capitalize = exports.notOf = exports.awaitAll = void 0;
/**
 * Returns a tuple of `[fulfilled, rejected]` promises.
 */
function awaitAll(promises) {
    return __awaiter(this, void 0, void 0, function* () {
        let fulfilled = [];
        let rejected = [];
        for (const settled of yield Promise.allSettled(promises)) {
            if (settled.status === "fulfilled")
                fulfilled.push(settled.value);
            else
                rejected.push(settled.reason);
        }
        return [fulfilled, rejected];
    });
}
exports.awaitAll = awaitAll;
function notOf(excluded) {
    if (excluded instanceof Set) {
        return (x => !excluded.has(x));
    }
    else if (excluded instanceof Array) {
        return (x => !excluded.includes(x));
    }
    else {
        return (x => excluded !== x);
    }
}
exports.notOf = notOf;
/** Capitalizes the first character of a string */
function capitalize(str) {
    if (str.length === 0)
        return "";
    return str[0].toUpperCase() + str.slice(1);
}
exports.capitalize = capitalize;
function removeDuplicatesBy(arr, isEqual = (a, b) => a === b) {
    return arr.filter((x, idx) => {
        const foundIdx = arr.findIndex(a => isEqual(x, a));
        return foundIdx === idx || foundIdx === -1;
    });
}
exports.removeDuplicatesBy = removeDuplicatesBy;

import * as BotUtils from "../source/_core/bot_utils";
import { expect } from "chai"

describe("'BotUtils' works", () => {
    describe("'Capitalize' works", () => {
        it("Works on an empty string", () => {
            expect(BotUtils.capitalize("")).to.be.length(0);
        });
        it("Works on any other string", () => {
            expect(BotUtils.capitalize("hello!")).to.equal("Hello!");
            expect(BotUtils.capitalize("foo bar!")).to.equal("Foo bar!");
        });
    });

    describe("'NubBy' works", () => {
        it("Works on an empty array", () => expect(BotUtils.nubBy([])).to.be.length(0));
        it("Works with the default function", () => {
            expect(BotUtils.nubBy(["a", "b", "a", "c", "a", "c", "d"])).to.deep.equal(["a", "b", "c", "d"]);
        });
        it("Works with a custom function", () => {
            expect(BotUtils.nubBy(["a", "b", "c", "a", "b", "c"], (a, b) => a === "a")).to.deep.equal(["a", "b", "c", "b", "c"]);
        });
        it("Works with a complex custom function", () => {
            const arr = [
                { id: 1, name: "Josh" },
                { id: 3, name: "Joe" },
                { id: 2, name: "Dylan" },
                { id: 2, name: "Oliver" },
                { id: 1, name: "Peter" }
            ];
            const expected = [
                { id: 1, name: "Josh" },
                { id: 3, name: "Joe" },
                { id: 2, name: "Dylan" }
            ];
            expect(BotUtils.nubBy(arr, (a, b) => a.id === b.id)).to.deep.equal(expected);
        });
    });
});

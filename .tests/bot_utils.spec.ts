import * as BotUtils from "../source/_core/bot_utils";
import { expect } from "chai"

describe("'BotUtils' works", () => {
    describe("'capitalize' works", () => {
        it("Works on an empty string", () => {
            expect(BotUtils.capitalize("")).to.be.length(0);
        });
        it("Works on any other string", () => {
            expect(BotUtils.capitalize("hello!")).to.equal("Hello!");
            expect(BotUtils.capitalize("foo bar!")).to.equal("Foo bar!");
            expect(BotUtils.capitalize("STRING...")).to.equal("STRING...");
        });
    });

    describe("'quoteMessage' works", () => {
        it("Works when not going over the limit", () => {
            expect(BotUtils.quoteMessage("Hello!")).to.equal("> Hello!");
        });
        it("Works when going over the limit", () => {
            expect(BotUtils.quoteMessage("Hello World!", 5)).to.equal("> Hello...");
        });
        it("Works when going over the limit, but only by less than 3 ('...')", () => {
            expect(BotUtils.quoteMessage("Hello World!", 10)).to.equal("> Hello World!");
        });
    });

    describe("'removeDuplicatesBy' works", () => {
        it("Works on an empty array", () => expect(BotUtils.removeDuplicatesBy([])).to.be.length(0));
        it("Works with the default function", () => {
            expect(BotUtils.removeDuplicatesBy(["a", "b", "a", "c", "a", "c", "d"])).to.deep.equal(["a", "b", "c", "d"]);
        });
        it("Works with a custom function", () => {
            expect(BotUtils.removeDuplicatesBy(["a", "b", "c", "a", "b", "c"], (a, b) => a === "a")).to.deep.equal(["a", "b", "c", "b", "c"]);
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
            expect(BotUtils.removeDuplicatesBy(arr, (a, b) => a.id === b.id)).to.deep.equal(expected);
        });
    });

    describe("'parseMessageLink' works", () => {
        it("Properly returns undefined for a link in an incorrect format", () => {
            expect(BotUtils.parseMessageLink("https://discord.com/channels/123456789012345678/246801357900011122")).to.be.undefined;
            expect(BotUtils.parseMessageLink("https://discord.com/channels/123456789012345678/@me/246801357900011122")).to.be.undefined;
            expect(BotUtils.parseMessageLink("https://discord.com/@me/channels/123456789012345678/246801357900011122")).to.be.undefined;
            expect(BotUtils.parseMessageLink("https://discord.com/")).to.be.undefined;
            expect(BotUtils.parseMessageLink("123412341234123412/123456789012345678/246801357900011122")).to.be.undefined;
        });
        it("Works with a guild message link", () => {
            const msgLink = "https://discord.com/channels/123412341234123412/123456789012345678/246801357900011122"
            expect(BotUtils.parseMessageLink(msgLink)).to.deep.equal({
                guildID: "123412341234123412",
                channelID: "123456789012345678",
                messageID: "246801357900011122"
            });
        });
        it("Works with a DM message link", () => {
            const msgLink = "https://discord.com/channels/@me/123456789012345678/246801357900011122";
            expect(BotUtils.parseMessageLink(msgLink)).to.deep.equal({
                guildID: undefined,
                channelID: "123456789012345678",
                messageID: "246801357900011122"
            });
        });
    });
});

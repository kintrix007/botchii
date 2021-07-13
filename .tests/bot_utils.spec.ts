import { capitalize, quoteMessage, removeDuplicatesBy, parseMessageLink, isCommand, adminPermission, Command } from "../source/_core/bot_core";
import { expect } from "chai"

describe("Bot core works", () => {
    describe("'capitalize' works", () => {
        it("Works on an empty string", () => {
            expect(capitalize("")).to.be.length(0);
        });
        it("Works on any other string", () => {
            expect(capitalize("hello!")).to.equal("Hello!");
            expect(capitalize("foo bar!")).to.equal("Foo bar!");
            expect(capitalize("STRING...")).to.equal("STRING...");
        });
    });

    describe("'quoteMessage' works", () => {
        it("Works when not going over the limit", () => {
            expect(quoteMessage("Hello!")).to.equal("> Hello!");
        });
        it("Works when going over the limit", () => {
            expect(quoteMessage("Hello World!", 5)).to.equal("> Hello...");
        });
        it("Works when going over the limit, but only by less than 3 ('...')", () => {
            expect(quoteMessage("Hello World!", 10)).to.equal("> Hello World!");
        });
    });

    describe("'removeDuplicatesBy' works", () => {
        it("Works on an empty array", () => expect(removeDuplicatesBy([])).to.be.length(0));
        it("Works with the default function", () => {
            expect(removeDuplicatesBy(["a", "b", "a", "c", "a", "c", "d"])).to.deep.equal(["a", "b", "c", "d"]);
        });
        it("Works with a custom function", () => {
            expect(removeDuplicatesBy(["a", "b", "c", "a", "b", "c"], (a, b) => a === "a")).to.deep.equal(["a", "b", "c", "b", "c"]);
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
            expect(removeDuplicatesBy(arr, (a, b) => a.id === b.id)).to.deep.equal(expected);
        });
    });

    describe("'parseMessageLink' works", () => {
        it("Properly returns undefined for a link in an incorrect format", () => {
            expect(parseMessageLink("https://discord.com/channels/123456789012345678/246801357900011122")).to.be.undefined;
            expect(parseMessageLink("https://discord.com/channels/123456789012345678/@me/246801357900011122")).to.be.undefined;
            expect(parseMessageLink("https://discord.com/@me/channels/123456789012345678/246801357900011122")).to.be.undefined;
            expect(parseMessageLink("https://discord.com/")).to.be.undefined;
            expect(parseMessageLink("123412341234123412/123456789012345678/246801357900011122")).to.be.undefined;
        });
        it("Works with a guild message link", () => {
            const msgLink = "https://discord.com/channels/123412341234123412/123456789012345678/246801357900011122"
            expect(parseMessageLink(msgLink)).to.deep.equal({
                guildID: "123412341234123412",
                channelID: "123456789012345678",
                messageID: "246801357900011122"
            });
        });
        it("Works with a DM message link", () => {
            const msgLink = "https://discord.com/channels/@me/123456789012345678/246801357900011122";
            expect(parseMessageLink(msgLink)).to.deep.equal({
                guildID: undefined,
                channelID: "123456789012345678",
                messageID: "246801357900011122"
            });
        });
    });

    describe("'isCommand' works", () => {
        it("Returns false for non-object types", () => {
            expect(isCommand(undefined)).to.be.false;
            expect(isCommand(null)).to.be.false;
            expect(isCommand(0)).to.be.false;
            expect(isCommand(true)).to.be.false;
            expect(isCommand("FooBar")).to.be.false;
        });
        it("Disallows empty objects", () => {
            expect(isCommand({})).to.be.false;
        });
        it("Disallows arrays", () => {
            expect(isCommand([1, 2, 3])).to.be.false;
        });
        it("Disallows objects with only 'name' present", () => {
            expect(isCommand({ name: "foo" })).to.be.false;
        });
        it("Disallows objects with only 'call' present", () => {
            expect(isCommand({ call: () => () => {} })).to.be.false;
        });
        it("Allows objects with both 'name' and 'call' present", () => {
            expect(isCommand(<Command>{ name: "foo", call: () => {} })).to.be.true;
        });
        it("Allows unnecessary fields", () => {
            expect(isCommand(<Command>{ name: "foo", call: () => {}, foo: 10 })).to.be.true;
            expect(isCommand(<Command>{ name: "foo", call: () => {}, hello: "world" })).to.be.true;
            expect(isCommand(<Command>{ name: "foo", call: () => {}, default: {} })).to.be.true;
        });
        it("Allows all possible fields to be present", () => {
            expect(isCommand(<Command>{
                setup: () => {},
                call: () => {},
                name: "foo",
                aliases: [],
                group: "help",
                permissions: [ adminPermission ],
                usage: "foo [bar]",
                description: "",
                examples: [ [], ["bar"], ["baz"] ],
            })).to.be.true;
        });
        it("Disallows possible fields with incorrect types", () => {
            expect(isCommand({
                call: () => {},
                name: [],
                aliases: [],
            })).to.be.false;
            expect(isCommand({
                call: () => {},
                name: [],
                usage: [[]],
            })).to.be.false;
            expect(isCommand({
                call: () => {},
                name: [],
                permissions: adminPermission,
            })).to.be.false;
            expect(isCommand({ name: 100, call: () => {} })).to.be.false;
        });
        it("Allows 'usage' as string or string array", () => {
            expect(isCommand(<Command>{ name: "foo", call: () => {}, usage: "FooBar" })).to.be.true;
            expect(isCommand(<Command>{ name: "foo", call: () => {}, usage: ["Foo", "Bar"] })).to.be.true;
        });
    });
});

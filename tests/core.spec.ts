import { expect } from "chai";
import { MessageEmbed } from "discord.js";
import { createEmbed, prefs, tuple } from "../core/core";
import { REPLY_STATUS } from "../core/types";

describe("Bot core tested", () => {
    describe("tuple", () => {
        it("works", () => {
            const tup = tuple("Hello", Infinity, {});
            expect(tup).to.deep.equal(["Hello", Infinity, {}]);
        });
    });

    describe("createEmbed", () => {
        it("works with simple string", () => {
            expect(createEmbed("success", "Yay")).to.deep.equal(new MessageEmbed().setColor(REPLY_STATUS.success).setDescription("Yay"));
        });
        it("works with simple embed", () => {
            expect(createEmbed("neutral", { timestamp: 123, title: "Time?", desc: "Just look below!" })).to.deep.equal(
                new MessageEmbed().setColor(REPLY_STATUS.neutral).setTitle("Time?").setDescription("Just look below!").setTimestamp(123)
            );
        });
        it("works with 'current' timestamp", () => {
            const embed1 = createEmbed("failure", { timestamp: true });
            const embed2 = new MessageEmbed().setTimestamp();
            expect(embed1.timestamp!).to.be.approximately(embed2.timestamp!, 1000);
        });
    });

    describe("guild permissions", () => {
        const randomId1 = "test1234567890123456"
        const randomId2 = "test2816578153195731";
        const randomId3 = "test8264193821786213";
        const randomId4 = "test9869281636187120";
        it("works without changing the prefs path", () => {
            const admin = prefs(randomId1, "admin");
            admin.set({ roleId: randomId2 });
            expect(admin.get()).to.deep.equal({ roleId: randomId2 });
            admin.set({ roleId: randomId3 });
            expect(admin.get()).to.not.deep.equal({ roleId: randomId2 });
            expect(admin.get()).to.deep.equal({ roleId: randomId3 });
        });
        it("works with changing the prefs path", () => {
            const aliases1 = prefs(randomId1, "aliases");
            aliases1.set({ firstAlias: [randomId1, randomId3] });
            expect(aliases1.get()).to.deep.equal({ firstAlias: [randomId1, randomId3] });
            const aliases2 = prefs(randomId2, "aliases");
            aliases2.set({ thirdAlias: [randomId4] });
            expect(aliases2.get()).to.deep.equal({ thirdAlias: [randomId4] });
            const aliases3 = prefs(randomId3, "aliases");
            aliases3.set({ secondAlias: [randomId1, randomId2] });
            expect(aliases3.get()).to.deep.equal({ secondAlias: [randomId1, randomId2] });
            expect(aliases1.get()).to.deep.equal({ firstAlias: [randomId1, randomId3] });
        });
    });
});

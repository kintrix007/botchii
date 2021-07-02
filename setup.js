"use strict";

const fs = require("fs");
const readline = require("readline");

const CONFIG_FILE = "config.json";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const configExsists = fs.existsSync(CONFIG_FILE);
const shouldAutoAccept = process.argv.slice(2).some(x => [ "-y", "--yes", "--accept" ].includes(x));

if (configExsists) {
    promptDeleteConfig(() => {
        promptCreateConfig();
    });
}

rl.on("close", () => {
    process.exit(0);
});

promptCreateConfig();


function promptDeleteConfig(callback = undefined) {
    if (shouldAutoAccept) process.exit(0);
    rl.question(`File '${CONFIG_FILE}' already exists. Do you want to overwrite it? (y/N) `, answer => {
        rl.pause();
        if (![ "y", "yes" ].includes(answer.toLowerCase())) {
            process.exit(0);
        }
        fs.unlinkSync(CONFIG_FILE);
        console.log(`-- removed file '${CONFIG_FILE}' --`);
        callback && callback();
    });
}

function promptCreateConfig(callback = undefined) {
    rl.question("Enter the bot token: ", token => {
        rl.question("Enter the owner's user ID: ", ownerID => {
            if ([...ownerID].some(x => isNaN(parseInt(x)))) {
                console.log("Owner ID is invalid!");
                process.exit(1);
            }
            const configObj = {
                botToken: token,
                botOwnerID: ownerID
            };
            const configJSON = JSON.stringify(configObj, undefined, 2);
            fs.writeFileSync(CONFIG_FILE, configJSON);
            console.log(`-- created file '${CONFIG_FILE}' --`);
            rl.close()
            callback && callback();
        })
    });
}

const bot = require("./bot/bot");
const { browser, notify } = require("./browser");
const { db } = require("./deta");

async function startBot() {
    console.log("⋯  Application starting...\n");
    await db.init();
    console.log("✓  [1/3] Database initialized.");
    await browser.init({
        headless: true,
    });
    console.log("✓  [2/3] Browser started.");
    await bot.start({
        onStart: async ({ username }) => {
            console.log(
                `✓  [3/3] @${username} is now running.\n\n✓  All set!\nStarting notification checker...\n`
            );

            // Each promises are always true loops. They will run forever and fetch updates - if there is new updates notifies user.
            // Probably not a good way to acheive this. (Definitely not)
            Promise.all([
                notify("trackingmore"),
                notify("m.aftership"),
                notify("aftership"),
            ]);
        },
    });
}

startBot();

// process.on("beforeExit", async () => {
//     await browser.close();
// });

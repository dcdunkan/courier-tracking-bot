const bot = require("./bot/bot");
const { browser } = require("./browser");
const notify = require("./helpers/notify");
const { db } = require("./deta");

async function startBot() {
  console.log("⋯  Application starting...\n");

  await db.init();
  console.log("✓  [1/3] Database initialized.");

  await browser.init({ headless: true });
  console.log("✓  [2/3] Browser started.");

  await bot.start({
    onStart: async ({ username }) => {
      console.log(
        `✓  [3/3] @${username} is now running.\n\n✓  All set!\nStarting notification checker...\n`
      );

      // Each promises are always true loops. They will run forever and fetch updates - if there is new updates notifies user.
      // "inefficient and slow sh*t." --> couln't find a better way to do this. if you know, pr :)
      await Promise.all([
        notify("trackingmore", bot),
        notify("m.aftership", bot),
        notify("aftership", bot),
      ]);
    },
  });
}

startBot();

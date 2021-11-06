const { Bot, GrammyError, HttpError } = require("grammy");
const env = require("../env");
const i18n = require("../helpers/i18n");
const { log } = require("../helpers/logger");

const bot = new Bot(env.BOT_TOKEN);

// Error handler from docs.
bot.catch(async (err) => {
  const ctx = err.ctx;
  const e = err.error;

  // If it is an old/invalid inlineQuery error -> ignore.
  if (
    ctx.inlineQuery &&
    e instanceof GrammyError &&
    e.description ==
      "Bad Request: query is too old and response timeout expired or query ID is invalid"
  ) {
    return;
  }

  await log(
    `Error while handling update ${ctx.update.update_id}:\n${
      err.message
    }\n\n${new Date()}`
  );

  console.error(`Error while handling update ${ctx.update.update_id}:`);
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.use(i18n.middleware());

// Commands
const startHandler = require("./handlers/commands/start");
const helpHandler = require("./handlers/commands/help");
const aboutHandler = require("./handlers/commands/about");
const statsHandler = require("./handlers/commands/stats");

bot.command("start", startHandler);
bot.command("help", helpHandler);
bot.command("about", aboutHandler);
bot.command("stats", statsHandler);

// trackings management
const trackingsHandler = require("./handlers/commands/trackings");
const trackingPagesHandler = require("./handlers/callbacks/userTrackings");
const removeTrackingHandler = require("./handlers/callbacks/removeTracking");

bot.command("trackings", trackingsHandler);
bot.callbackQuery(/trackings_(.+)/, trackingPagesHandler);
bot.callbackQuery(/remove_(.+)_(.+)/, removeTrackingHandler);

// Other callbackQuery handlers
const detectHandler = require("./handlers/callbacks/detect");
const getHandler = require("./handlers/callbacks/getPossibleCarrier");
const chooseCarrierHandler = require("./handlers/callbacks/chooseCarrier");
const notifyHandler = require("./handlers/callbacks/notify");

bot.callbackQuery(/detect_(.+)/, detectHandler);
bot.callbackQuery(/get-(.+)_(.+)/, getHandler);
bot.callbackQuery(/choose-carrier_(.+)_(.+)/, chooseCarrierHandler);
bot.callbackQuery(/notify_(.+)_(.+)/, notifyHandler);

// Refresh handlers x 3
const trackingmoreRefreshHandler = require("./handlers/callbacks/refresh/trackingmore");
const aftershipRefreshHandler = require("./handlers/callbacks/refresh/aftership");
const mAftershipRefreshHandler = require("./handlers/callbacks/refresh/maftership");

bot.callbackQuery(/tmrefresh_(.+)/, trackingmoreRefreshHandler);
bot.callbackQuery(/^asrefresh_(.+)_(.+)/, aftershipRefreshHandler);
bot.callbackQuery(/masrefresh_(.+)/, mAftershipRefreshHandler);

// on updates
const textMsgHandler = require("./handlers/updates/message");
const inlineQueryHandler = require("./handlers/updates/inlineQuery");

bot.on("msg:text", textMsgHandler);
bot.on("inline_query", inlineQueryHandler);

const {
  blockedHandler,
  unblockedHandler,
} = require("./handlers/updates/block");

const { isBlock, isUnblock } = require("../helpers/filters");

bot.on("my_chat_member:new_chat_member").filter(isBlock, blockedHandler); // if the user stops & blocks the bot, stop trying to send updates.
bot.on("my_chat_member:new_chat_member").filter(isUnblock, unblockedHandler); // if the user unblocks and restart the bot, continue sending updates.

module.exports = bot;

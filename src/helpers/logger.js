const bot = require("../bot/bot");
const env = require("../env");

module.exports.log = async function (message) {
  if (!env.LOG) return;
  let prefix = `<a href="https://t.me/${bot.botInfo.username}">${bot.botInfo.first_name}</>`;
  return await bot.api.sendMessage(env.LOG_CHAT_ID, prefix + message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
};

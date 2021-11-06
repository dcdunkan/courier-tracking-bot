const { config } = require("dotenv");
const { cleanEnv, str, num, bool } = require("envalid");

config();

module.exports = cleanEnv(process.env, {
  BOT_TOKEN: str(),
  DETA_KEY: str(),
  LOG: bool({
    default: false,
  }),
  LOG_CHAT_ID: num(),
});

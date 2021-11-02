const { config } = require("dotenv");
const { cleanEnv, str } = require("envalid");

config();

module.exports = cleanEnv(process.env, {
    BOT_TOKEN: str(),
    DETA_KEY: str(),
});

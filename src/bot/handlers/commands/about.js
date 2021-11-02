const { db } = require("../../../deta");
const { aboutMessage } = require("../messages");

module.exports = async function (ctx) {
    db.writeUser({
        id: ctx.from.id,
        username: ctx.from.username !== undefined ? ctx.from.username : "x",
    });
    await ctx.reply(aboutMessage, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
    });
};

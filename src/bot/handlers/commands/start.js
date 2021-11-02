const { db } = require("../../../deta");

module.exports = async function (ctx) {
    await db.writeUser({
        id: ctx.from.id,
        username: ctx.from.username !== undefined ? ctx.from.username : "x",
    });
    await ctx.reply(
        `👋🏼 Hi there! I can track your couriers and give you the updates about it. Send me a valid tracking ID, and I will do the rest of the job.\n\n/help — For help message »`,
        {
            parse_mode: "HTML",
            disable_web_page_preview: true,
        }
    );
};

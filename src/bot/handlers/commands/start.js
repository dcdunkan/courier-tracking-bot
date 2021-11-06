const { db } = require("../../../deta");

module.exports = async function (ctx) {
  await db.writeUser({
    id: ctx.from.id,
    username: ctx.from.username !== undefined ? ctx.from.username : "x",
  });

  // Track payload.

  // Normal start command
  await ctx.reply(ctx.i18n.t("start_msg"), {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
};

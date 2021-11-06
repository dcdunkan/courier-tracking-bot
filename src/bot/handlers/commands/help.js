const { db } = require("../../../deta");

module.exports = async function (ctx) {
  db.writeUser({
    id: ctx.from.id,
    username: ctx.from.username !== undefined ? ctx.from.username : "x",
  });
  await ctx.reply(ctx.i18n.t("help_msg"), {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
};

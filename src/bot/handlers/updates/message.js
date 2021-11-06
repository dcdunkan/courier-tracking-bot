const { InlineKeyboard } = require("grammy");
const { db } = require("../../../deta");

module.exports = async function (ctx) {
  await db.writeUser({
    id: ctx.from.id,
    username: ctx.from.username !== undefined ? ctx.from.username : "x",
  });

  const tracking_id = ctx.message.text;
  if (
    tracking_id.length < 4 ||
    tracking_id.length > 40 ||
    tracking_id.split(/\n/g).length > 1
  ) {
    return await ctx.reply(ctx.i18n.t("invalid_id"));
  }

  let keyboard = new InlineKeyboard()
    .text("👀 Auto-Detect", `detect_${tracking_id}`)
    .row()
    .text("📃 Choose a carrier", `choose-carrier_${tracking_id}_1`);

  await ctx.reply(ctx.i18n.t("choose_method"), {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
};

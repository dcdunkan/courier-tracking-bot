module.exports = async function (ctx) {
  await ctx.reply(ctx.i18n.t("faq_msg"), {
    parse_mode: "HTML",
  });
};

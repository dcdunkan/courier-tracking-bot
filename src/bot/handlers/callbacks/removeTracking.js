const { InlineKeyboard } = require("grammy");
const { db } = require("../../../deta");

module.exports = async function (ctx) {
  const source = ctx.match[1];
  const tracking_id = ctx.match[2];
  await db
    .removeTracking({
      source: source,
      tracking_id: tracking_id,
      user_id: ctx.from.id,
    })
    .then(async ({ status }) => {
      if (status == "removed") {
        await ctx.editMessageText(
          ctx.i18n.t("remove_success", {
            tracking_id: tracking_id,
          }),
          {
            reply_markup: new InlineKeyboard().text(
              "← My tracking list",
              `trackings_1`
            ),
          }
        );
      }

      if (status == "not found") {
        await ctx.answerCallbackQuery({
          text: ctx.i18n.t("remove_failed_not_exists", {
            tracking_id: tracking_id,
          }),
          show_alert: true,
        });
      }
    })
    .catch(async () => {
      await ctx.answerCallbackQuery({
        text: ctx.i18n.t("remove_failed", {
          tracking_id: tracking_id,
        }),
        show_alert: true,
      });
    });
};

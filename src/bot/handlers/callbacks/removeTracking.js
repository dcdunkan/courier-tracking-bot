const { InlineKeyboard } = require("grammy");
const { db } = require("../../../deta");

module.exports = async function (ctx) {
    const source = ctx.match[1];
    const tracking_id = ctx.match[2];
    await db
        .removeTracking(source, tracking_id, ctx.from.id)
        .then(async ({ status }) => {
            if (status == "removed") {
                await ctx.editMessageText(
                    `Tracking ID ${tracking_id} has been successfully removed from your trackings list.`,
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
                    text: `Failed to remove your tracking ${tracking_id} from your trackings list. Looks like it does not actually exists in your trackings.`,
                    show_alert: true,
                });
            }
        })
        .catch(async () => {
            await ctx.answerCallbackQuery({
                text: `Failed to remove your tracking ${tracking_id} from your trackings list.`,
                show_alert: true,
            });
        });
};

const { InlineKeyboard } = require("grammy");
const { getTrackingmore } = require("../../../../browser");
const { db } = require("../../../../deta");

module.exports = async function (ctx) {
  await ctx.answerCallbackQuery({
    text: ctx.i18n.t("requesting"),
  });
  const tracking_id = ctx.match[1];
  let user_trackings = await db.getUserTrackings(ctx.from.id);

  const tm_results = await getTrackingmore(tracking_id);

  if (!tm_results || tm_results.updates.length === 0) {
    let keyboard = new InlineKeyboard().text(
      "🔄 Try again",
      `tmrefresh_${tracking_id}`
    );

    let date = new Date().toUTCString();
    return ctx.reply(
      ctx.i18n.t("failed_to_fetch", {
        service: "TrackingMore",
        date: date,
      }),
      {
        reply_markup: keyboard,
      }
    );
  }

  let updates = ctx.i18n.t("updates");
  for (let i = 0; i < tm_results.updates.length; i++) {
    updates +=
      `\n🕐 ${tm_results.updates[i].time}:\n` +
      `📰 ${tm_results.updates[i].event}\n`;
  }

  let keyboard = new InlineKeyboard().text(
    "🔄 Refresh",
    `tmrefresh_${tracking_id}`
  );

  let exists_in_db = user_trackings.some(
    (tracking) =>
      tracking.tracking_id === tracking_id && tracking.source == "trackingmore"
  );
  if (!tm_results.is_delivered) {
    if (exists_in_db) {
      keyboard.inline_keyboard.push([
        {
          text: "🔕 Unsubscribe",
          callback_data: `remove_trackingmore_${tracking_id}`,
        },
      ]);
    } else {
      keyboard.inline_keyboard.push([
        {
          text: "🔔 Notify me on updates",
          callback_data: `notify_tm_${tracking_id}`,
        },
      ]);
    }
  }

  let date = new Date().toUTCString();
  return await ctx.editMessageText(
    ctx.i18n.t("details_msg", {
      carrier_name: tm_results.carrier.name,
      tracking_id: tracking_id,
      current_status: tm_results.current_status,
      source_url: tm_results.source.url,
      source_name: tm_results.source.name,
      updates: updates,
      date: date,
    }),
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: keyboard,
    }
  );
};

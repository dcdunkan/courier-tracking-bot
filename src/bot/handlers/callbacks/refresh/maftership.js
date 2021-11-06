const { InlineKeyboard } = require("grammy");
const { getMAfterShip } = require("../../../../browser");
const { db } = require("../../../../deta");

module.exports = async function (ctx) {
  await ctx.answerCallbackQuery({
    text: ctx.i18n.t("requesting"),
  });

  const tracking_id = ctx.match[1];
  let user_trackings = await db.getUserTrackings(ctx.from.id);

  const mas_results = await getMAfterShip(tracking_id);

  if (mas_results == null || mas_results.updates.length == 0) {
    let keyboard = new InlineKeyboard().text(
      "🔄 Try again",
      `masrefresh_${tracking_id}`
    );
    let date = new Date().toUTCString();
    return ctx.reply(
      ctx.i18n.t("failed_to_fetch", {
        service: "M-AfterShip",
        date: date,
      }),
      {
        reply_markup: keyboard,
      }
    );
  }

  let updates = ctx.i18n.t("updates");
  for (let i = 0; i < mas_results.updates.length; i++) {
    updates +=
      `\n🕐 ${mas_results.updates[i].time}:\n` +
      `📍 ${mas_results.updates[i].place}\n` +
      `📰 ${mas_results.updates[i].event}\n`;
  }

  let keyboard = new InlineKeyboard().text(
    "🔄 Refresh",
    `masrefresh_${tracking_id}`
  );
  let exists_in_db = user_trackings.some(
    (tracking) =>
      tracking.tracking_id === tracking_id && tracking.source == "m.aftership"
  );
  if (!mas_results.is_delivered) {
    if (exists_in_db) {
      keyboard.inline_keyboard.push([
        {
          text: "🔕 Unsubscribe",
          callback_data: `remove_m.aftership_${tracking_id}`,
        },
      ]);
    } else {
      keyboard.inline_keyboard.push([
        {
          text: "🔔 Notify me on updates",
          callback_data: `notify_mas_${tracking_id}`,
        },
      ]);
    }
  }

  let date = new Date().toUTCString();
  return await ctx.editMessageText(
    ctx.i18n.t("details_msg", {
      carrier_name: mas_results.carrier.name,
      tracking_id: tracking_id,
      current_status: mas_results.current_status,
      source_url: mas_results.source.url,
      source_name: mas_results.source.name,
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

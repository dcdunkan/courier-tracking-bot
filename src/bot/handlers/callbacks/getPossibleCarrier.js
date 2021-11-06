const { InlineKeyboard } = require("grammy");
const { getAftership } = require("../../../browser");
const { db } = require("../../../deta");

module.exports = async function (ctx) {
  await ctx.answerCallbackQuery({
    text: ctx.i18n.t("requesting"),
  });
  const tracking_id = ctx.match[1];
  const slug = ctx.match[2];

  let user_trackings = await db.getUserTrackings(ctx.from.id);

  const as_results = await getAftership(tracking_id, slug);
  if (Array.isArray(as_results) || as_results.updates.length == 0) {
    let date = new Date().toUTCString();
    return ctx.reply(
      ctx.i18n.t("failed_to_fetch", {
        service: "AfterShip",
        date: date,
      }),
      {
        reply_markup: new InlineKeyboard().text(
          "🔄 Try again",
          `asrefresh_${tracking_id}_${slug}`
        ),
      }
    );
  }

  let updates = ctx.i18n.t("updates");
  for (let i = 0; i < as_results.updates.length; i++) {
    updates +=
      `\n🕐 ${as_results.updates[i].time}:\n` +
      `📍 ${as_results.updates[i].place}\n` +
      `📰 ${as_results.updates[i].event}\n`;
  }

  let keyboard = new InlineKeyboard().text(
    "🔄 Refresh",
    `asrefresh_${tracking_id}_${slug}`
  );

  const exists_in_db = user_trackings.some(
    (tracking) =>
      tracking.tracking_id === tracking_id && tracking.source === "aftership"
  );

  if (!as_results.is_delivered) {
    if (exists_in_db) {
      keyboard.inline_keyboard.push([
        {
          text: "🔕 Unsubscribe",
          callback_data: `remove_aftership_${tracking_id}`,
        },
      ]);
    } else {
      keyboard.inline_keyboard.push([
        {
          text: "🔔 Notify me on updates",
          callback_data: `notify_as_${tracking_id}_${slug}`,
        },
      ]);
    }
  }

  let date = new Date().toUTCString();
  return await ctx.reply(
    ctx.i18n.t("details_msg", {
      carrier_name: as_results.carrier.name,
      tracking_id: tracking_id,
      current_status: as_results.current_status,
      source_url: as_results.source.url,
      source_name: as_results.source.name,
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

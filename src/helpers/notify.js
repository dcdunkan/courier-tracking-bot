const { InlineKeyboard } = require("grammy");
const { getTrackingmore, getAftership, getMAfterShip } = require("../browser");
const { db } = require("../deta");

module.exports = async function (source, bot) {
  console.log(`⋯  ${source} notifier is now running...`);
  while (true) {
    const trackings = await db.getTrackings(source);

    for (let i = 0; i < trackings.length; i++) {
      let results, keyboard;

      if (source == "trackingmore") {
        results = await getTrackingmore(trackings[i].tracking_id);
        keyboard = new InlineKeyboard().text(
          "📬 Get full details",
          `tmrefresh_${trackings[i].tracking_id}`
        );
      } else if (source == "m.aftership") {
        results = await getMAfterShip(trackings[i].tracking_id);
        keyboard = new InlineKeyboard().text(
          "📬 Get full details",
          `masrefresh_${trackings[i].tracking_id}`
        );
      } else if (source == "aftership") {
        if (!trackings[i].data.slug) trackings[i].data.slug = undefined;

        results = await getAftership(
          trackings[i].tracking_id,
          trackings[i].data.slug
        );

        keyboard = new InlineKeyboard().text(
          "📬 Get full details",
          `asrefresh_${trackings[i].tracking_id}_${trackings[i].data.slug}`
        );
      } else return;

      // worst case scenario: no valid results?: skip for now.
      if (
        !results ||
        Array.isArray(results) ||
        results.updates.length == 0 ||
        results.updates[0].time == "" ||
        results.updates[0].event == "" ||
        (results.updates[0].event === trackings[i].data.updates[0].event &&
          results.updates[0].time === trackings[i].data.updates[0].time)
      ) {
        continue;
      }

      // if there is something new and valid.
      let message = ctx.i18n.t("new_update", {
        tracking_id: results.tracking_id,
        time: results.updates[0].time,
        event: results.updates[0].event,
        source_url: trackings[i].source_url,
        source: trackings[i].source,
      });
      // 1. but if the latest data is "delivered", remove from db & inform the user about both update and removal.
      if (results.is_delivered) {
        message += ctx.i18n.t("new_update_delivered");
        await db.removeTracking({
          source: source,
          tracking_id: results.tracking_id,
          user_id: trackings[i].user_id,
        });
      } else {
        // 2. if latest update is not "delivered", update the db & inform the user.
        keyboard.inline_keyboard.push([
          {
            text: "🔕 Unsubscribe",
            callback_data: `remove_${source}_${results.tracking_id}`,
          },
        ]);

        await db.updateTracking({
          current_status: results.current_status,
          data: results,
          latest_update: results.updates[0],
          source: results.source.code,
          source_url: results.source_url,
          tracking_id: results.tracking_id,
          user_id: trackings[i].user_id,
        });
      }

      await bot.api.sendMessage(trackings[i].user_id, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: keyboard,
      });
    }
  }
};

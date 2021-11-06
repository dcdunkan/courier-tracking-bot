const { InlineKeyboard } = require("grammy");
const {
  getTrackingmore,
  getAftership,
  getMAfterShip,
} = require("../../../browser/");
const { db } = require("../../../deta");

module.exports = async function (ctx) {
  await ctx.answerCallbackQuery();
  const tracking_id = ctx.match[1];

  const user_trackings = await db.getUserTrackings(ctx.from.id);

  await ctx.editMessageText(ctx.i18n.t("trying_in_tm"), {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  const tm_results = await getTrackingmore(tracking_id);

  // If there is no valid returns from trackingmore, m.as
  if (!tm_results || !tm_results.updates || tm_results.updates.length === 0) {
    await ctx.editMessageText(ctx.i18n.t("failed_in_tm"), {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    // https://m.aftership.com
    const mas_results = await getMAfterShip(tracking_id);

    if (mas_results && mas_results.updates.length !== 0) {
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
          tracking.tracking_id === tracking_id &&
          tracking.source == "m.aftership"
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
      return await ctx.reply(
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
    }

    // If no results from trackingmore & https://m.aftership.com --> aftership's main page.
    const as_results = await getAftership(tracking_id);

    // If there is multiple possible carriers,
    if (Array.isArray(as_results)) {
      await ctx.editMessageText(ctx.i18n.t("multi_possible_carriers"));

      // Goes to each page of possible carriers with the tracking ID.
      let possible_carriers = [];
      for (let i = 0; i < as_results.length; i++) {
        await ctx.editMessageText(
          ctx.i18n.t("checking_in_multi", {
            no: i + 1,
            total: as_results.length,
            carrier: as_results[i].name,
          })
        );
        let results = await getAftership(tracking_id, as_results[i].slug);

        // If it contains any valid (true) returns, push to successful possible carriers.
        const is_valid =
          !Array.isArray(results) &&
          results.current_status != "Not found" &&
          results.updates.length > 0;

        if (is_valid) {
          possible_carriers.push(results);
        }
      }

      // If no successful (which contains any valid return) possible carriers, end of road X.
      if (possible_carriers.length === 0) {
        await ctx.deleteMessage();
        return await ctx.reply(ctx.i18n.t("failed_in_as"), {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
      }

      // If there is successful possible carriers, sends keyboard of the carriers, and let user choose.
      let keyboard = [];
      for (let i = 0; i < possible_carriers.length; i++) {
        keyboard.push([
          {
            text: possible_carriers[i].carrier.name,
            callback_data: `get-${tracking_id}_${possible_carriers[i].slug}`,
          },
        ]);
      }

      if (keyboard.length == 1) {
        return await ctx.editMessageText(
          ctx.i18n.t("one_possile_carrier", {
            carrier: keyboard[0][0].text,
          }),
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: keyboard,
            },
          }
        );
      }

      await ctx.deleteMessage();
      return await ctx.reply(ctx.i18n.t("choose_possible_carrier"), {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }

    await ctx.deleteMessage();

    // If there is no multiple possible carriers.
    // And, if there is updates in the returned tracking object.
    if (as_results.updates.length > 0) {
      let updates = ctx.i18n.t("updates");
      for (let i = 0; i < as_results.updates.length; i++) {
        updates +=
          `\n🕐 ${as_results.updates[i].time}:\n` +
          `📍 ${as_results.updates[i].place}\n` +
          `📰 ${as_results.updates[i].event}\n`;
      }

      let keyboard = new InlineKeyboard().text(
        "🔄 Refresh",
        `asrefresh_${tracking_id}_x`
      );

      let exists_in_db = user_trackings.some(
        (tracking) =>
          tracking.tracking_id === tracking_id && tracking.source == "aftership"
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
              callback_data: `notify_as_${tracking_id}_x`,
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
    }

    // nothing.
    return await ctx.reply(ctx.i18n.t("failed_in_as"), {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }

  // if there is details in trackingmore
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
  await ctx.deleteMessage();
  return await ctx.reply(
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

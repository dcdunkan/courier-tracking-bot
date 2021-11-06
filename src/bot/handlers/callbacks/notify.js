const { InlineKeyboard } = require("grammy");
const { db } = require("../../../deta");
const {
  getTrackingmore,
  getMAfterShip,
  getAftership,
} = require("../../../browser");

module.exports = async function (ctx) {
  await ctx.answerCallbackQuery({
    text: ctx.i18n.t("adding_to_list"),
  });

  let user_trackings = await db.getUserTrackings(ctx.from.id);

  let tracking_id = ctx.match[1].split("_")[1];
  if (tracking_id === undefined) tracking_id = ctx.match[2];

  let as_slug = ctx.match[2];
  if (as_slug == "x" || undefined) as_slug = "";
  else as_slug += "/";

  const source = ctx.match[1].split("_")[0];
  let results, source_name, source_url;
  if (source === "tm") {
    results = await getTrackingmore(tracking_id);
    source_name = "TrackingMore";
    source_url = `https://trackingmore.com/all/en/${tracking_id}`;
  } else if (source === "mas") {
    results = await getMAfterShip(tracking_id);
    source_name = "M.AfterShip";
    source_url = `https://m.aftership.com/${tracking_id}`;
  } else if (source === "as") {
    results = await getAftership(tracking_id, as_slug);
    source_name = "AfterShip";
    if (as_slug == "x" || undefined) as_slug = "";
    else as_slug += "/";
    source_url = `https://aftership.com/track/${as_slug}${tracking_id}`;
  } else {
    await ctx.reply(ctx.i18n.t("add_to_list_failed"));
  }

  as_slug = ctx.match[2];
  if (as_slug == "x" || undefined) as_slug = "";

  const source_name_code = source_name.toLowerCase();

  if (!results || Array.isArray(results) || results.updates.length === 0) {
    return await ctx.answerCallbackQuery({
      text: ctx.i18n.t("invalid_result", {
        source_name: source_name,
      }),
      show_alert: true,
    });
  }

  if (results.is_delivered === true) {
    return ctx.reply(
      ctx.i18n.t("already_delivered", {
        tracking_id: tracking_id,
      }),
      { parse_mode: "HTML" }
    );
  }

  const exists_in_db = user_trackings.some(
    (tracking) =>
      tracking.tracking_id === tracking_id &&
      tracking.source === source_name_code
  );

  if (exists_in_db) {
    return ctx.reply(
      ctx.i18n.t("exists_in_db", {
        tracking_id: tracking_id,
      }),
      { parse_mode: "HTML" }
    );
  }

  const tracking = await db.addTracking({
    current_status: results.current_status,
    data: results,
    latest_update: results.updates[0],
    source: source_name_code,
    source_url: source_url,
    tracking_id: tracking_id,
    user_id: ctx.from.id,
  });

  if (tracking.status !== "exists" && tracking.status !== "added") {
    return await ctx.reply(ctx.i18n.t("add_to_list_failed"));
  }

  if (tracking.status === "exists") {
    await ctx.reply(
      ctx.i18n.t("exists_in_list", {
        tracking_id: tracking_id,
      }),
      { parse_mode: "HTML" }
    );
  } else if (tracking.status === "added") {
    await ctx.reply(
      ctx.i18n.t("add_to_list_success", {
        tracking_id: tracking_id,
      }),
      { parse_mode: "HTML" }
    );
  }

  let refresh_cbdata = `${source}refresh_${tracking_id}`;
  if (source === "as") refresh_cbdata + `_${as_slug}`;

  return await ctx.editMessageReplyMarkup({
    reply_markup: new InlineKeyboard()
      .text("🔄 Refresh", refresh_cbdata)
      .row()
      .text("🔕 Unsubscribe", `remove_${source_name_code}_${tracking_id}`),
  });
};

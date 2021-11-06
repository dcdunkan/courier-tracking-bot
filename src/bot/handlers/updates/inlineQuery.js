const { InlineKeyboard } = require("grammy");
const { db } = require("../../../deta");

module.exports = async function (ctx) {
  await db.writeUser({
    id: ctx.from.id,
    username: ctx.from.username !== undefined ? ctx.from.username : "x",
  });

  let trackings = await db.getUserTrackings(ctx.from.id);

  if (trackings.length == 0) {
    return await ctx.answerInlineQuery(
      [
        {
          type: "article",
          title: ctx.i18n.t("inline.list_empty_title"),
          description: ctx.i18n.t("inline.list_empty_desc"),
          id: "no-results",
          input_message_content: {
            message_text: ctx.i18n.t("inline.list_empty_msg"),
          },
        },
      ],
      {
        cache_time: 100,
        is_personal: true,
        switch_pm_text: ctx.i18n.t("inline.switch_pm_text"),
        switch_pm_parameter: "start",
      }
    );
  }

  let offset = parseInt(ctx.inlineQuery.offset);

  if (Number.isNaN(offset)) {
    offset = 1;
  }

  // starting element and last elements for the results of this offset.
  const start = 50 * (offset - 1),
    end = 50 * offset - 1;

  // slice elements we need for this results offset.
  trackings = trackings.slice(start, end);

  if (trackings.length == 0) {
    return await ctx.answerInlineQuery(
      [
        {
          type: "article",
          title: ctx.i18n.t("inline.end_of_results_title"),
          description: ctx.i18n.t("inline.end_of_results_desc"),
          id: "end-of-results",
          input_message_content: {
            message_text: ctx.i18n.t("inline.end_of_results_msg"),
          },
        },
      ],
      {
        cache_time: 100,
        is_personal: true,
        switch_pm_text: ctx.i18n.t("inline.switch_pm_text"),
        switch_pm_parameter: "start",
      }
    );
  }

  let results = [];

  for (let i = 0; i < trackings.length; i++) {
    let date = new Date();
    results.push({
      type: "article",
      title: `ID - ${trackings[i].tracking_id} - ${trackings[i].data.source.name}`,
      description: `${trackings[i].current_status} - ${trackings[i].latest_update.event}`,
      id: `iq_${trackings[i].tracking_id}_${trackings[i].source}`,
      input_message_content: {
        message_text: ctx.i18n.t("inline.result_msg", {
          tracking: trackings[i],
          date: date.toUTCString(),
        }),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      },
      reply_markup: new InlineKeyboard().url(
        "🚛 Show full details",
        `https://t.me/${ctx.me.username}?start=trk_${trackings[i].tracking_id}_${trackings[i].source}`
      ),
    });
  }

  await ctx.answerInlineQuery(results, {
    cache_time: 100,
    is_personal: true,
    next_offset: `${offset + 1}`,
    switch_pm_text: ctx.i18n.t("inline.switch_pm_text"),
    switch_pm_parameter: "start",
  });
};

const { db } = require("../../../deta");

module.exports = async function (ctx) {
  await db.writeUser({
    id: ctx.from.id,
    username: ctx.from.username !== undefined ? ctx.from.username : "x",
  });

  const trackings = await db.getUserTrackings(ctx.from.id);

  if (trackings.length == 0) {
    return await ctx.reply(ctx.i18n.t("empty_tracking_list"));
  }

  const keyboard = [];
  let limit = trackings.length > 10 ? 10 : trackings.length;
  let pages = trackings.length <= 10 ? 1 : Math.ceil(trackings.length / 10);
  let tracking_msg = "";

  for (let i = 0; i < limit; i++) {
    tracking_msg += `\n${i + 1} • <code>${trackings[i].tracking_id}</> (${
      trackings[i].data.carrier.name
    } - ${trackings[i].data.source.name})`;
    switch (trackings[i].source) {
      case "trackingmore":
        keyboard.push([
          {
            text: `${i + 1}`,
            callback_data: `tmrefresh_${trackings[i].tracking_id}`,
          },
          {
            text: `🔕`,
            callback_data: `remove_trackingmore_${trackings[i].tracking_id}`,
          },
          {
            text: `🔄`,
            callback_data: `tmrefresh_${trackings[i].tracking_id}`,
          },
        ]);
        break;

      case "aftership":
        if (trackings[i].data.slug)
          keyboard.push([
            {
              text: `${i + 1}`,
              callback_data: `asrefresh_${trackings[i].tracking_id}_${trackings[i].data.slug}`,
            },
            {
              text: `🔕`,
              callback_data: `remove_aftership_${trackings[i].tracking_id}`,
            },
            {
              text: `🔄`,
              callback_data: `asrefresh_${trackings[i].tracking_id}_${trackings[i].data.slug}`,
            },
          ]);
        else
          keyboard.push([
            {
              text: `${i + 1}`,
              callback_data: `asrefresh_${trackings[i].tracking_id}_x`,
            },
            {
              text: `🔕`,
              callback_data: `remove_aftership_${trackings[i].tracking_id}`,
            },
            {
              text: `🔄`,
              callback_data: `asrefresh_${trackings[i].tracking_id}_x`,
            },
          ]);
        break;

      case "m.aftership":
        keyboard.push([
          {
            text: `${i + 1}`,
            callback_data: `masrefresh_${trackings[i].tracking_id}`,
          },
          {
            text: `🔕`,
            callback_data: `remove_m.aftership_${trackings[i].tracking_id}`,
          },
          {
            text: `🔄`,
            callback_data: `masrefresh_${trackings[i].tracking_id}`,
          },
        ]);
    }
  }

  if (pages > 1) {
    keyboard.push([
      {
        text: "Next >",
        callback_data: "trackings_2",
      },
    ]);
  }

  await ctx.reply(
    ctx.i18n.t("trackings_msg", {
      page: 1,
      pages: pages,
      trackings: tracking_msg,
    }),
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: keyboard },
    }
  );
};

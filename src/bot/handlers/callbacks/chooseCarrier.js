const { browser } = require("../../../browser");

module.exports = async function (ctx) {
  await ctx.answerCallbackQuery({
    text: ctx.i18n.t("requesting"),
  });
  const tracking_id = ctx.match[1];
  const page = parseInt(ctx.match[2]);

  // TrackingMore -> Later. https://trackingmore.com/carriers.html
  // const keyboard = new InlineKeyboard().text("AfterShip", `as-carrier_${tracking_id}_1`).text("TrackingMore", `tm-carrier_${tracking_id}_1`);

  const max_per_page = 16;
  const start = max_per_page * (page - 1),
    end = max_per_page * page;

  const carriers = browser.aftership_carriers.slice(start, end);

  let last_page = page - 1,
    next_page = page + 1;

  let pages = Math.ceil(browser.aftership_carriers.length / max_per_page);

  // page looping
  if (page == 1)
    last_page = Math.ceil(browser.aftership_carriers.length / max_per_page);
  if (page == pages) next_page = 1;

  let keyboard = [];

  for (let i = 0; i < carriers.length; i += 2) {
    if (carriers[i + 1] === undefined) {
      keyboard.push([
        {
          text: `${carriers[i].name}`,
          callback_data: `get-${tracking_id}_${carriers[i].slug}`,
        },
      ]);
      continue;
    }

    keyboard.push([
      {
        text: `${carriers[i].name}`,
        callback_data: `get-${tracking_id}_${carriers[i].slug}`,
      },
      {
        text: `${carriers[i + 1].name}`,
        callback_data: `get-${tracking_id}_${carriers[i + 1].slug}`,
      },
    ]);
  }
  keyboard.push([
    {
      text: "⬅️",
      callback_data: `choose-carrier_${tracking_id}_${last_page}`,
    },
    {
      text: "➡️",
      callback_data: `choose-carrier_${tracking_id}_${next_page}`,
    },
  ]);

  ctx.editMessageText(
    ctx.i18n.t("choose_carrier", {
      page: page,
      pages: pages,
    }),
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: keyboard },
    }
  );
};

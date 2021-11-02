const { InlineKeyboard } = require("grammy");
const { getMAfterShip } = require("../../../../browser");
const { db } = require("../../../../deta");

module.exports = async function (ctx) {
    await ctx.answerCallbackQuery({
        text: "⏳ Requesting the data...",
    });

    const tracking_id = ctx.match[1];
    let user_trackings = await db.getUserTrackings(ctx.from.id);

    const mas_results = await getMAfterShip(tracking_id);

    if (mas_results == null || mas_results.updates.length == 0) {
        let keyboard = new InlineKeyboard().text(
            "🔄 Try again",
            `masrefresh_${tracking_id}`
        );
        return ctx.reply(
            "Oops. I couldn't find any details from AfterShip. Please try again - it might be the issues with API stuff.",
            {
                reply_markup: keyboard,
            }
        );
    }

    let updates = `🔄 <b>Updates</>\n`;
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
    if (!mas_results.is_delivered) {
        if (
            user_trackings.some(
                (tracking) =>
                    tracking.tracking_id === tracking_id &&
                    tracking.source == "m.aftership"
            )
        ) {
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

    let date = new Date();
    return await ctx.editMessageText(
        `Here is your courier details from <b>${
            mas_results.carrier.name
        }</>:\n\nTracking ID: <code>${tracking_id}</>\nCurrent Status: <b>${
            mas_results.current_status
        }</>\n\n${updates}\n\n🚛 Carrier: ${
            mas_results.carrier.name
        }\n\nSource: <a href="${mas_results.source.url}">${
            mas_results.source.name
        }</>\n\nLast updated: ${date.toUTCString()}`,
        {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: keyboard,
        }
    );
};

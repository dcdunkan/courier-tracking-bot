const { InlineKeyboard } = require("grammy");
const { getTrackingmore } = require("../../../../browser");
const { db } = require("../../../../deta");

module.exports = async function (ctx) {
    await ctx.answerCallbackQuery({
        text: "⏳ Requesting the data...",
    });
    const tracking_id = ctx.match[1];
    let user_trackings = await db.getUserTrackings(ctx.from.id);

    const tm_results = await getTrackingmore(tracking_id);

    if (tm_results.updates.length == 0) {
        let keyboard = new InlineKeyboard().text(
            "🔄 Try again",
            `tmrefresh_${tracking_id}`
        );

        return ctx.reply(
            "Oops. I couldn't find any details from TrackingMore. Please try again - it might be the issues with API stuff.",
            {
                reply_markup: keyboard,
            }
        );
    }

    let updates = `🔄 <b>Updates</>\n`;
    for (let i = 0; i < tm_results.updates.length; i++) {
        updates +=
            `\n🕐 ${tm_results.updates[i].time}:\n` +
            `📰 ${tm_results.updates[i].event}\n`;
    }

    let keyboard = new InlineKeyboard().text(
        "🔄 Refresh",
        `tmrefresh_${tracking_id}`
    );

    if (!tm_results.is_delivered) {
        if (
            user_trackings.some(
                (tracking) =>
                    tracking.tracking_id === tracking_id &&
                    tracking.source == "trackingmore"
            )
        ) {
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

    let date = new Date();
    return await ctx.editMessageText(
        `Here is your courier details from <b>${
            tm_results.carrier.name
        }</>:\n\nTracking ID: <code>${tracking_id}</>\nCurrent Status: <b>${
            tm_results.current_status
        }</>\n\n${updates}\n\n🚛 Carrier: ${
            tm_results.carrier.name
        }\n\nSource: <a href="${tm_results.source.url}">${
            tm_results.source.name
        }</>\n\nLast updated: ${date.toUTCString()}`,
        {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: keyboard,
        }
    );
};

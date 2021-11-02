const { InlineKeyboard } = require("grammy");
const { getAftership } = require("../../../browser");
const { db } = require("../../../deta");

// See src/bot/handlers/callback-handlers/detect.js:108 for context.
// This callbackQuery--eed buttons gets sent when there is successful (valid)
// multiple possible carriers.
module.exports = async function (ctx) {
    await ctx.answerCallbackQuery({
        text: "⏳ Requesting the data...",
    });
    const tracking_id = ctx.match[1];
    const slug = ctx.match[2];

    let user_trackings = await db.getUserTrackings(ctx.from.id);

    const as_results = await getAftership(tracking_id, slug);

    if (Array.isArray(as_results) || as_results.updates.length == 0) {
        let keyboard = new InlineKeyboard().text(
            "🔄 Try again",
            `asrefresh_${tracking_id}_${slug}`
        );

        let date = new Date();
        return ctx.reply(
            `Oops. I couldn't find any details from AfterShip. Please try again - it might be the issues with API stuff.\n\nLast tried: ${date.toUTCString()}`,
            {
                reply_markup: keyboard,
            }
        );
    }

    let updates = `🔄 <b>Updates</>\n`;
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

    if (!as_results.is_delivered) {
        if (
            user_trackings.some(
                (tracking) =>
                    tracking.tracking_id === tracking_id &&
                    tracking.source == "aftership"
            )
        ) {
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

    let date = new Date();
    return await ctx.reply(
        `Here is your courier details from <b>${
            as_results.carrier.name
        }</>:\n\nTracking ID: <code>${tracking_id}</>\nCurrent Status: <b>${
            as_results.current_status
        }</>\n\n${updates}\n\n🚛 Carrier: ${
            as_results.carrier.name
        }\n\nSource: <a href="${as_results.source.url}">${
            as_results.source.name
        }</>\n\nLast updated: ${date.toUTCString()}`,
        {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: keyboard,
        }
    );
};

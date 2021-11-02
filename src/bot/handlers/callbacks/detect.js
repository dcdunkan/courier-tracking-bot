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

    let user_trackings = await db.getUserTrackings(ctx.from.id);

    await ctx.editMessageText(
        `👀 Trying in <a href="https://trackingmore.com">TrackingMore</>...`,
        {
            parse_mode: "HTML",
            disable_web_page_preview: true,
        }
    );

    const tm_results = await getTrackingmore(tracking_id);

    // If there is no valid returns from trackingmore, tries in aftership.
    if (tm_results.updates.length == 0) {
        await ctx.editMessageText(
            `I couldn't find any results from <a href="https://trackingmore.com">TrackingMore</>. Let me check on AfterShip, you can leave the notifications on, and I will notify you when the results are ready.`,
            {
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }
        );

        // before checking on https://aftership.com, check on https://m.aftership.com
        let mas_results = await getMAfterShip(tracking_id);
        if (mas_results && mas_results.updates.length != 0) {
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
            return await ctx.reply(
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
        }

        // If the trackingmore & https://m.aftership.com results are empty, we can check on aftership's main page.
        let as_results = await getAftership(tracking_id);

        // If there is multiple possible carriers,
        if (Array.isArray(as_results)) {
            await ctx.editMessageText(
                "🤔 Looks like there is multiple possible carriers for your tracking ID. Please wait while I find valid details from any of the possible carriers."
            );

            let possible_carriers = [];
            for (let i = 0; i < as_results.length; i++) {
                // Goes to each page of possible carriers with the tracking ID.
                await ctx.editMessageText(
                    `[${i + 1}/${as_results.length}] Checking on ${
                        as_results[i].name
                    }...`
                );
                let r = await getAftership(tracking_id, as_results[i].slug);

                // If it contains any valid (true) returns, push to successful possible carriers.
                if (
                    !Array.isArray(r) &&
                    r.current_status != "Not found" &&
                    r.updates.length > 0
                ) {
                    possible_carriers.push(r);
                }
            }

            // If no successful (which contains any valid return) possible carriers, end of road X.
            if (possible_carriers.length == 0) {
                await ctx.deleteMessage();
                return await ctx.reply(
                    "Oops. I couldn't find any details from AfterShip. Please verify that you have entered a valid tracking number and try again later."
                );
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
                    `Wooh. I got it. And there is one valid possible carrier: <b>${keyboard[0][0].text}</>. Click the button below to get the details about it.`,
                    {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: keyboard,
                        },
                    }
                );
            }

            await ctx.deleteMessage();
            return await ctx.reply(
                "By the way, there is an confusion. I fetched the details of your courier. But it says that there is multiple possible carriers for your tracking ID. So, which one you pick? I can show the details about it.",
                {
                    reply_markup: {
                        inline_keyboard: keyboard,
                    },
                }
            );
        }

        await ctx.deleteMessage();

        // If there is no multiple possible carriers.
        // And, if there is updates in the returned object.
        if (as_results.updates.length > 0) {
            let updates = `🔄 <b>Updates</>\n`;
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
                            callback_data: `notify_as_${tracking_id}_x`,
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
        }

        // nothing.
        return await ctx.reply(
            "Oops. I couldn't find any details from AfterShip. Please verify that you have entered a valid tracking number and try again later."
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
    await ctx.deleteMessage();
    return await ctx.reply(
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

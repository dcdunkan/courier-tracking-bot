const { InlineKeyboard } = require("grammy");
const { db } = require("../../../deta");
const {
    getTrackingmore,
    getMAfterShip,
    getAftership,
} = require("../../../browser");

module.exports = async function (ctx) {
    ctx.answerCallbackQuery({
        text: "🔔 Adding to Notifications... Please wait...",
    });

    const service = ctx.match[1].split("_")[0];
    let user_trackings = await db.getUserTrackings(ctx.from.id);

    let tracking_id = ctx.match[1].split("_")[1];
    if (tracking_id === undefined) tracking_id = ctx.match[2];

    let as_slug = ctx.match[2];
    if (as_slug == "x" || undefined) as_slug = "";

    // future update: maybe -- make this a common one: no swtich cases since most of the code is same.
    switch (service) {
        case "tm":
            const tm_results = await getTrackingmore(tracking_id);

            if (tm_results.updates.length == 0) {
                return ctx.answerCallbackQuery({
                    text: "🍕 I couldn't get the updates from TrackingMore. Please try again later.",
                    show_alert: true,
                });
            }

            if (!tm_results.is_delivered) {
                if (
                    user_trackings.some(
                        (tracking) =>
                            tracking.tracking_id === tracking_id &&
                            tracking.source == "trackingmore"
                    )
                ) {
                    return ctx.reply(
                        `The tracking ID <code>${tracking_id}</> already exists in your notification list. See /trackings to manage your notifications.`,
                        { parse_mode: "HTML" }
                    );
                }
            } else {
                // if it is delivered, tell user it cannot be added to the db because there won't be any updates.
                return ctx.reply(
                    `The tracking ID <code>${tracking_id}</> has been delivered already. Therefore, there won't be any new updates, so, it cannot be added to your tracking notification list.`,
                    { parse_mode: "HTML" }
                );
            }

            let tm_tracking = await db.addTracking({
                current_status: tm_results.current_status,
                data: tm_results,
                latest_update: tm_results.updates[0],
                source: "trackingmore",
                source_url: `https://trackingmore.com/all/en/${tracking_id}`,
                tracking_id: tracking_id,
                user_id: ctx.from.id,
            });

            if (tm_tracking.status == "added") {
                await ctx.reply(
                    `<code>${tracking_id}</> has been added to Trackings. I will notify you on new updates. Use /trackings to manage your subscribed trackings.`,
                    { parse_mode: "HTML" }
                );

                return await ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                        .text("🔄 Refresh", `tmrefresh_${tracking_id}`)
                        .row()
                        .text(
                            "🔕 Unsubscribe",
                            `remove_trackingmore_${tracking_id}`
                        ),
                });
            }
            if (tm_tracking.status == "exists") {
                await ctx.reply(
                    `<code>${tracking_id}</> already exists in Trackings. I will notify you on new updates. Use /trackings to manage your subscribed trackings.`,
                    { parse_mode: "HTML" }
                );

                return await ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                        .text("🔄 Refresh", `tmrefresh_${tracking_id}`)
                        .row()
                        .text(
                            "🔕 Unsubscribe",
                            `remove_trackingmore_${tracking_id}`
                        ),
                });
            }

            ctx.reply(
                "Couldn't add the tracking to your trackings. Please try again later."
            );
            break;

        case "mas":
            const mas_results = await getMAfterShip(tracking_id);

            if (!mas_results || mas_results.updates.length == 0) {
                return ctx.answerCallbackQuery({
                    text: "🍕 I couldn't get the updates from TrackingMore. Please try again later.",
                    show_alert: true,
                });
            }

            if (!mas_results.is_delivered) {
                if (
                    user_trackings.some(
                        (tracking) =>
                            tracking.tracking_id === tracking_id &&
                            tracking.source == "m.aftership"
                    )
                ) {
                    return ctx.reply(
                        `The tracking ID <code>${tracking_id}</> already exists in your notification list. See /trackings to manage your notifications.`,
                        { parse_mode: "HTML" }
                    );
                }
            } else {
                // if it is delivered, tell user it cannot be added to the db because there won't be any updates.
                return ctx.reply(
                    `The tracking ID <code>${tracking_id}</> has been delivered already. Therefore, there won't be any new updates, so, it cannot be added to your tracking notification list.`,
                    { parse_mode: "HTML" }
                );
            }

            let mas_tracking = await db.addTracking({
                tracking_id: tracking_id,
                user_id: ctx.from.id,
                current_status: mas_results.current_status,
                latest_update: mas_results.updates[0],
                data: mas_results,
                source: "m.aftership",
                source_url: `https://m.aftership.com/${tracking_id}`,
            });

            if (mas_tracking.status == "added") {
                await ctx.reply(
                    `<code>${tracking_id}</> has been added to Trackings. I will notify you on new updates. Use /trackings to manage your subscribed trackings.`,
                    { parse_mode: "HTML" }
                );

                return await ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                        .text("🔄 Refresh", `masrefresh_${tracking_id}`)
                        .row()
                        .text(
                            "🔕 Unsubscribe",
                            `remove_m.aftership_${tracking_id}`
                        ),
                });
            }
            if (mas_tracking.status == "exists") {
                await ctx.reply(
                    `<code>${tracking_id}</> already exists in Trackings. I will notify you on new updates. Use /trackings to manage your subscribed trackings.`,
                    { parse_mode: "HTML" }
                );
                return await ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                        .text("🔄 Refresh", `masrefresh_${tracking_id}`)
                        .row()
                        .text(
                            "🔕 Unsubscribe",
                            `remove_m.aftership_${tracking_id}`
                        ),
                });
            }
            ctx.reply(
                "Couldn't add the tracking to your trackings. Please try again later."
            );
            break;

        case "as":
            const as_results = await getAftership(tracking_id, as_slug);

            if (Array.isArray(as_results) || as_results.updates.length == 0) {
                return ctx.answerCallbackQuery({
                    text: "🍕 I couldn't get the updates from TrackingMore. Please try again later.",
                    show_alert: true,
                });
            }

            if (!as_results.is_delivered) {
                if (
                    user_trackings.some(
                        (tracking) =>
                            tracking.tracking_id === tracking_id &&
                            tracking.source == "aftership"
                    )
                ) {
                    return ctx.reply(
                        `The tracking ID <code>${tracking_id}</> already exists in your notification list. See /trackings to manage your notifications.`,
                        { parse_mode: "HTML" }
                    );
                }
            } else {
                // if it is delivered, tell user it cannot be added to the db because there won't be any updates.
                return ctx.reply(
                    `The tracking ID <code>${tracking_id}</> has been delivered already. So, there won't be any new updates, and it cannot be added to your tracking notification list. Try another one, you really want to track.`,
                    { parse_mode: "HTML" }
                );
            }

            let as_tracking = await db.addTracking({
                tracking_id: tracking_id,
                user_id: ctx.from.id,
                current_status: as_results.current_status,
                latest_update: as_results.updates[0],
                data: as_results,
                source: "aftership",
                source_url: `https://aftership.com/track/${as_slug}${tracking_id}`,
            });

            if (as_tracking.status == "added") {
                await ctx.reply(
                    `<code>${tracking_id}</> has been added to Trackings. I will notify you on new updates. Use /trackings to manage your subscribed trackings.`,
                    { parse_mode: "HTML" }
                );

                return await ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                        .text(
                            "🔄 Refresh",
                            `asrefresh_${tracking_id}_${as_results.slug}`
                        )
                        .row()
                        .text(
                            "🔕 Unsubscribe",
                            `remove_aftership_${tracking_id}`
                        ),
                });
            }
            if (as_tracking.status == "exists") {
                await ctx.reply(
                    `<code>${tracking_id}</> already exists in Trackings. I will notify you on new updates. Use /trackings to manage your subscribed trackings.`,
                    { parse_mode: "HTML" }
                );
                return await ctx.editMessageReplyMarkup({
                    reply_markup: new InlineKeyboard()
                        .text(
                            "🔄 Refresh",
                            `asrefresh_${tracking_id}_${as_results.slug}`
                        )
                        .row()
                        .text(
                            "🔕 Unsubscribe",
                            `remove_aftership_${tracking_id}`
                        ),
                });
            }
            ctx.reply(
                "Couldn't add the tracking to your trackings. Please try again later."
            );
            break;
    }
};

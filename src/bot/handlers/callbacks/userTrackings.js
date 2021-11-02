const { db } = require("../../../deta");

module.exports = async function (ctx) {
    await ctx.answerCallbackQuery();
    let trackings = await db.getUserTrackings(ctx.from.id);
    if (trackings.length == 0) {
        return await ctx.editMessageText(
            `Ow. It looks like you haven't added any tracking IDs to your trackings list to get notifications on updates. Try adding one next time 😉`
        );
    }

    // page requested for.
    let page = parseInt(ctx.match[1]);
    // Previous and next pages.
    let last_page = `${page - 1}`,
        next_page = `${page + 1}`;
    // Total pages.
    let pages = Math.ceil(trackings.length / 10);
    // starting element and last elements for this nth page.
    const start = 10 * (page - 1),
        end = 10 * page - 1;

    // slice elements we need for this page.
    trackings = trackings.slice(start, end);

    if (trackings.length == 0) {
        return ctx.editMessageText(
            "Oops. Problem while getting your trackings. Please try again later with /trackings."
        );
    }

    const keyboard = [];
    let message = `📖 Here is your trackings. You can manage them here. Click on 🔕 to remove it from the trackings list and disable notification. Click 🔄 to get the latest updates of the tracking ID.\n\n<i>Showing page ${page} of ${pages}</>\n`;

    for (let i = 0; i < trackings.length; i++) {
        switch (trackings[i].source) {
            case "trackingmore":
                message += `\n${i + 1} • <code>${
                    trackings[i].tracking_id
                }</> (${trackings[i].data.carrier.name} - TrackingMore)`;
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
                message += `\n${i + 1} • <code>${
                    trackings[i].tracking_id
                }</> (${trackings[i].data.carrier.name} - AfterShip)`;
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
                message += `\n${i + 1} • <code>${
                    trackings[i].tracking_id
                }</> (${trackings[i].data.carrier.name} - M.AfterShip)`;
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

    if (page == 1) {
        keyboard.push([
            {
                text: "Next >",
                callback_data: `trackings_${next_page}`,
            },
        ]);
    } else {
        // pages in between
        if (page != pages) {
            keyboard.push([
                {
                    text: "< Prev",
                    callback_data: `trackings_${last_page}`,
                },
                {
                    text: "Next >",
                    callback_data: `trackings_${next_page}`,
                },
            ]);
        } else {
            // last page.
            keyboard.push([
                {
                    text: "< Prev",
                    callback_data: `trackings_${last_page}`,
                },
            ]);
        }
    }

    await ctx.editMessageText(message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: keyboard },
    });
};

const { db } = require("../../../deta");

module.exports = async function (ctx) {
    await db.writeUser({
        id: ctx.from.id,
        username: ctx.from.username !== undefined ? ctx.from.username : "x",
    });

    const trackings = await db.getUserTrackings(ctx.from.id);

    if (trackings.length == 0) {
        return await ctx.reply(
            `Ow. It looks like you haven't added any tracking IDs to your trackings list to get notifications on updates. Try adding one next time 😉`
        );
    }

    const keyboard = [];
    let limit = trackings.length > 10 ? 10 : trackings.length;
    let pages = trackings.length <= 10 ? 1 : Math.ceil(trackings.length / 10);
    let message = `📖 Here is your trackings. You can manage them here.\n\n<i>Showing page 1 of ${pages}</>\n`;

    for (let i = 0; i < limit; i++) {
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

    if (pages > 1) {
        keyboard.push([
            {
                text: "Next >",
                callback_data: "trackings_2",
            },
        ]);
    }

    await ctx.reply(message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: keyboard },
    });
};

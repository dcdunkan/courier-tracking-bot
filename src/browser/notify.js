const { InlineKeyboard } = require("grammy");
const { getAftership, getMAfterShip } = require("./aftership");
const { getTrackingmore } = require("./trackingmore");
const bot = require("../bot/bot");
const { db } = require("../deta");

module.exports = async function (source) {
    console.log(`⋯  ${source} notifier is now running...`);

    // run forever. i don't know is this the tight way to do this.
    while (true) {
        const trackings = await db.getTrackings(source);

        for (let i = 0; i < trackings.length; i++) {
            let results, keyboard;

            if (source == "trackingmore") {
                results = await getTrackingmore(trackings[i].tracking_id);
                keyboard = new InlineKeyboard().text(
                    "📬 Get full details",
                    `tmrefresh_${trackings[i].tracking_id}`
                );
            } else if (source == "m.aftership") {
                results = await getMAfterShip(trackings[i].tracking_id);
                keyboard = new InlineKeyboard().text(
                    "📬 Get full details",
                    `masrefresh_${trackings[i].tracking_id}`
                );
            } else if (source == "aftership") {
                if (!trackings[i].data.slug) trackings[i].data.slug = undefined;

                results = await getAftership(
                    trackings[i].tracking_id,
                    trackings[i].data.slug
                );

                keyboard = new InlineKeyboard().text(
                    "📬 Get full details",
                    `asrefresh_${trackings[i].tracking_id}_${trackings[i].data.slug}`
                );
            } else return;

            // worst case scenario: no valid results?: skip for now.
            if (
                Array.isArray(results) ||
                results.updates.length == 0 ||
                results.updates[0].time == "" ||
                results.updates[0].event == "" ||
                (results.updates[0].event ===
                    trackings[i].data.updates[0].event &&
                    results.updates[0].time ===
                        trackings[i].data.updates[0].time)
            ) {
                continue;
            }

            // if there is something new and valid.
            let message = `✨ Hey! There is some new updates on your <code>${results.tracking_id}</> tracking ID!\n\n<b>Latest update</>:\n🕐 ${results.updates[0].time}\n📰 ${results.updates[0].event}\n\nSource: <a href="${trackings[i].source_url}">${trackings[i].source}</>\n\n`;
            // 1. but if the latest data is "delivered", remove from db & inform the user about both update and removal.
            if (results.is_delivered) {
                message += `Also, the latest results says that your package has been delivered. So, we are removing this tracking ID from your /trackings list.`;
                await db.removeTracking(
                    source,
                    results.tracking_id,
                    trackings[i].user_id
                );
            } else {
                // 2. if latest update is not "delivered", update the db & inform the user.
                keyboard.inline_keyboard.push([
                    {
                        text: "Unsubscribe",
                        callback_data: `remove_${source}_${results.tracking_id}`,
                    },
                ]);

                await db.updateTracking({
                    current_status: results.current_status,
                    data: results,
                    latest_update: results.updates[0],
                    source: results.source.code,
                    source_url: results.source_url,
                    tracking_id: results.tracking_id,
                    user_id: trackings[i].user_id,
                });
            }

            await bot.api.sendMessage(trackings[i].user_id, message, {
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: keyboard,
            });
        }
    }
};

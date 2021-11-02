const { InlineKeyboard } = require("grammy");
const { db } = require("../../../deta");

module.exports = async function (ctx) {
    await db.writeUser({
        id: ctx.from.id,
        username: ctx.from.username !== undefined ? ctx.from.username : "x",
    });

    const tracking_id = ctx.message.text;
    if (tracking_id.length < 4) {
        return await ctx.reply(
            "😕 Hmm, its not a valid tracking ID, right? Please send a valid tracking ID, in order to fetch the details."
        );
    }

    let keyboard = new InlineKeyboard()
        .text("👀 Auto-Detect", `detect_${tracking_id}`)
        .row()
        .text("📃 Choose a carrier", `choose-carrier_${tracking_id}_1`);

    await ctx.reply(
        `Choose a method to fetch the details of your courier.\n» <b>👀 Auto-Detect</> method would be the best choice if you don't know the courier carrier. We will take your tracking ID and try to detect the courier to give you the details. Some times it won't work as expected.\n» Or, <b>📃 Choose a carrier</> to get the results more accurate and faster, but only if you know the carrier, I prefer choosing this method.`,
        {
            parse_mode: "HTML",
            reply_markup: keyboard,
        }
    );
};

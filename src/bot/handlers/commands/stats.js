const { db } = require("../../../deta");

module.exports = async function (ctx) {
  const { total_users } = await db.stats.get("users");
  const { total_tracked, currently_tracking } = await db.stats.get("trackings");

  await ctx.reply(
    ctx.i18n.t("stats_msg", {
      total_users: total_users,
      total_tracked: total_tracked,
      currently_tracking: currently_tracking,
    })
  );
};

const { db } = require("../../../deta");

module.exports = {
  blockedHandler: async function (ctx) {
    await db.userBlocked(ctx.from.id);
  },
  unblockedHandler: async function (ctx) {
    await db.userUnblocked(ctx.from.id);
  },
};

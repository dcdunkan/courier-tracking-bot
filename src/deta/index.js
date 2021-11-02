const env = require("../env");
const { DetaDB } = require("./deta");

const db = new DetaDB(env.DETA_KEY);

module.exports = { DetaDB, db };

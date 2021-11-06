const csv2json = require("csvtojson");

module.exports = async () => {
  const csv = await fetch("https://track.aftership.com/couriers/download");
  let csv_text = await csv.text();
  csv_text = csv_text.split("\n");
  csv_text.splice(0, 1, "slug,name");
  csv_text = csv_text.join("\n");
  return await csv2json().fromString(csv_text);
};

const { load } = require("cheerio");
const { browser } = require("./browser");

async function getTrackingmore(tracking_id) {
  if (tracking_id === undefined) {
    return console.log("No tracking_id were passed in. (getTrackingMore)");
  }

  const content = await browser.getContent(
    `https://trackingmore.com/all/en/${tracking_id}`
  );
  const $ = load(content);

  const data = {
    tracking_id: tracking_id,
    carrier: {
      name: $(
        "#isshow > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > span:nth-child(2)"
      ).text(),
    },
    current_status: `${$("span.date-v1:nth-child(4)").text()} ${$(
      "span.date-v1:nth-child(5)"
    ).text()}`,
    is_delivered: false,
    updates: [],
    source: {
      name: "TrackingMore",
      code: "trackingmore",
      url: "https://trackingmore.com",
    },
    source_url: `https://trackingmore.com/all/en/${tracking_id}`,
  };

  if (data.current_status.startsWith("Delivered")) data.is_delivered = true;

  $("#tbResultChange > div").each((i, div) => {
    data.updates.push({
      time: $(div)
        .children("div.info")
        .children("div:nth-child(1)")
        .children("div.time")
        .text()
        .trim(),

      event: $(div)
        .children("div.info")
        .children("div:nth-child(2)")
        .children("div.event")
        .text()
        .trim(),
    });
  });

  return data;
}

module.exports = { getTrackingmore };
// 9400111108435321335549, 9374889674006334890848

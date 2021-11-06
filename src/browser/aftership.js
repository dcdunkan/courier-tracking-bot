const { load } = require("cheerio");
const { browser } = require("./browser");

async function getContent(tracking_id, slug = undefined) {
  if (tracking_id === undefined || "") {
    console.log("No tracking_id were passed in. (getAftership)");
    return;
  }

  let url = `https://aftership.com/track/${tracking_id}`;

  if (slug !== undefined) {
    if (slug == "" || "x") url = `https://aftership.com/track/${tracking_id}`;
    url = `https://aftership.com/track/${slug}/${tracking_id}`;
  }

  const content = await browser.getContent(url);
  return { content, url };
}

async function getAftership(tracking_id, slug = undefined) {
  const { content, url } = await getContent(tracking_id, slug);
  const $ = load(content);

  if (
    $(
      "div.mr-4:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div > div > span"
    ).text() == "Select carrier"
  ) {
    let possible_carriers = [];

    $("div.px-5:nth-child(2) > div").each((_ind, carriers) => {
      for (let i = 0; i < browser.aftership_carriers.length; i++) {
        if (
          $(carriers).children("div").text().trim() ==
          browser.aftership_carriers[i].name
        ) {
          possible_carriers.push(browser.aftership_carriers[i]);
        }
      }
    });

    return possible_carriers;
  }

  const data = {
    tracking_id: tracking_id,
    slug: slug || null,
    carrier: {
      name: $("div.truncate").text(),
    },
    delivered_on: $("div.flex-1:nth-child(2) > div:nth-child(2)").text(),
    current_status: $(
      "#shipment-result-card > div:nth-child(1) > div:nth-child(1) > div.text-xl"
    )
      .text()
      .trim(),
    is_delivered: false,
    updates: [],
    source: {
      name: "AfterShip",
      code: "aftership",
      url: "https://aftership.com",
    },
    source_url: url,
  };

  if (data.current_status.startsWith("Delivered")) data.is_delivered = true;

  $("#checkpoints-container > ul:nth-child(1) > li").each((i, el) => {
    data.updates.push({
      event: $(el)
        .children("div.checkpoint__detail")
        .children("div.block")
        .children("div")
        .text(),
      time: $(el)
        .children("div.checkpoint__detail")
        .children("div:nth-child(2)")
        .children("div.svelte-1xmycpa")
        .children("p")
        .text(),
      place: $(el)
        .children("div.checkpoint__detail")
        .children("div:nth-child(2)")
        .children("div:nth-child(2)")
        .text()
        .trim(),
    });
  });

  return data;
}

async function getMAfterShip(tracking_id) {
  const content = await browser.getContent(
    `https://m.aftership.com/${tracking_id}`
  );
  const $ = load(content);

  if ($(".go23ee-6").text().trim() == "") return null;

  const data = {
    tracking_id: tracking_id,
    carrier: {
      name: $(".sc-1uv9gei-3").text(),
    },
    current_status: `${$("div.go23ee-2:nth-child(1)").text().trim()}. ${$(
      "div.go23ee-2:nth-child(2)"
    )
      .text()
      .trim()}`,
    is_delivered: false,
    updates: [],
    source: {
      name: "m.AfterShip",
      code: "m.aftership",
      url: "https://m.aftership.com",
    },
    source_url: `https://m.aftership.com/${tracking_id}`,
  };

  if (data.current_status.startsWith("Your order is delivered")) {
    data.is_delivered = true;
  }

  $("li.sc-1pinefg-1").each((i, el) => {
    // Is there a better way to do this? :/
    data.updates.push({
      event: $(el)
        .children("div:nth-child(3)")
        .children("p:nth-child(1)")
        .children("span:nth-child(1)")
        .text()
        .trim(),
      time: `${$(el)
        .children("div:nth-child(1)")
        .children("div:nth-child(1)")
        .children("p:nth-child(1)")
        .text()
        .trim()} ${$(el)
        .children("div:nth-child(1)")
        .children("div:nth-child(1)")
        .children("p:nth-child(2)")
        .text()
        .trim()}`,
      place: $(el)
        .children("div:nth-child(3)")
        .children("p:nth-child(2)")
        .text()
        .trim()
        .replace(/_/g, " "),
    });
  });

  return data;
}

// ^ 5962387761562

module.exports = {
  getAftership,
  getMAfterShip,
};

const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth"); // stealth plugin, why?: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth#readme
puppeteer.use(stealthPlugin()); // And, yes. TrackingMore detects Headless User agents and the site will not respond as expected.

const updateCarriers = require("./updateCarriers");

// A simplified puppeteer Browser class designed for this project's usecases.
class Browser {
    // Browser up?
    up = false;

    async init(options) {
        if (this.up) return;
        this.pptr = await puppeteer.launch({ ...options });
        this.up = true;

        await updateCarriers()
            .then((carriers) => {
                this.aftership_carriers = carriers;
                console.log("✓ Fetched latest carrier list from AfterShip.");
            })
            .catch((error) => {
                throw new Error(
                    "X Failed to fetch carrier list from AfterShip.",
                    error
                );
            });
    }

    async close() {
        await this.pptr.close();
        this.up = false;
    }

    async getContent(url) {
        if (!this.up) await this.init();
        const page = await this.pptr.newPage();
        await page
            .goto(url, { waitUntil: "networkidle0", timeout: 20000 })
            .catch(() => {
                return;
            });
        const content = await page.content();
        await page.close();
        return content;
    }
}

const browser = new Browser();

module.exports = { Browser, browser };
// Bonus:
// https://z9m3iyttf6qh.runkit.sh/

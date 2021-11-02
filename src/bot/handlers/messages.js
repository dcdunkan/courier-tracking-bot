module.exports = {
    aboutMessage: `<b>Few things about this <a href="https://t.me/PkgTrackBot">Package Tracking bot</a></b>.

Thanks to @WideWine for hosting this bot, and for the idea and support. Join @WideWine and support them too.
    
• Creator — @dcdunkan from @dcbots.
• Open-source — <a href="https://github.com/dcdunkan/package-tracker-bot">GitHub Repo:: dcdunkan/package-tracker-bot</> — Give it a star if you liked it.
• Language — JavaScript.
• Version — Still on Beta - v.0.1.4
    
<b>— Built using / Used Libraries</>
• <a href="https://grammy.dev/">grammY</> — Telegram Bot Framework used for this bot. - Trust me, simple but powerful.
• <a href="https://pptr.dev/">Puppeteer</> — A Node library that provides a high-level API to control headless Chrome over the DevTools Protocol. - Used for fetching the details from tracking websites.
• <a href="https://deta.sh/">Deta Base</> — NoSQL database with unlimited storage and completely free to use. - Used as database for this project.
    
<b>— Sites used to fetch details</>
• <a href="https://trackingmore.com">TrackingMore</>
• <a href="https://aftership.com">AfterShip</>`,

    helpMessage: `👋🏼 Hi there! I can help you to get details and new updates of your courier.
        
Send me a valid tracking ID and just wait. — maximum 30 seconds. I will send you the details. I can send you updates if you enable the notification.

You can select a method to get the details of your package.
1. <b>Auto detection</>: Use this method if you don't know about the package carrier.
2. <b>Choose Carrier</>: If you do know the package carrier's name, use this method to get more accurate results easily.

/help — Shows this message.
/trackings — Lists the tracking IDs you currently subscribed to (enabled notification) and lets you manage them.
/about — About this bot including source code details.
/faq - Some questions you probably gonna ask eventually.

This bot fetches data from services like <a href="https://aftership.com">AfterShip</>, <a href="https://trackingmore.com">TrackingMore</>. The data might be inaccurate or sometimes you won't get the details even if the ID is valid. Consider retrying or dropping the attempts since it harms the server.

Support us by joining our channel. Bot-related updates will be posted there.
<a href="https://t.me/dcbots">Join our channel »</a>
<a href="https://en.wikipedia.org/wiki/Tracking_number">Read about tracking numbers »</a>

Any suggestions, bugs and issues can be reported to my creator — @dcdunkan — No spamming, please.

Thank you for using this bot and I hope you liked it :)`,
};

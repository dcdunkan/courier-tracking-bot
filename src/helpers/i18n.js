// Multi
const { I18n } = require("@grammyjs/i18n");

const i18n = new I18n({
  defaultLanguageOnMissing: true,
  directory: "locales",
  defaultLanguage: "en",
});

module.exports = i18n;

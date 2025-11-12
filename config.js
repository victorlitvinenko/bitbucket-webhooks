// config.js - Конфигурация Discord webhooks

module.exports = {
  // Порт сервера
  port: process.env.PORT || 4001,

  // Discord Webhooks
  webhooks: {
    // Канал для коммитов
    commits:
      process.env.DISCORD_COMMITS ||
      "https://discord.com/api/webhooks/982023427198181477/15rVHSJwpjDrIqNzcDuDNs7rcU-u_dPRsBRbUWDKd2fAl_Qbb9WQGNbaA3tdAFF8R8-u",

    // Канал для Pull Requests
    pullrequests:
      process.env.DISCORD_PR ||
      "https://discord.com/api/webhooks/982009110465765386/oIP50yGaGoqNfytXmtC4WtXx1nvxbtufyc5RGcFde3SVTRfkbQzZzc_-B0WymZ2wP96U",
  },

  // Правила маршрутизации для умного режима
  routing: {
    // По названию репозитория
    byRepository: {
      frontend: ["main", "frontend", "commits"],
      backend: ["main", "backend", "commits"],
      mobile: ["main", "mobile", "commits"],
      api: ["main", "backend", "commits"],
    },

    // По типу события
    byEvent: {
      commit: ["main", "commits"],
      pr_created: ["main", "pullrequests"],
      pr_merged: ["main", "pullrequests", "important"],
      pr_declined: ["main", "pullrequests"],
    },

    // По ветке
    byBranch: {
      master: ["main", "important"],
      main: ["main", "important"],
      develop: ["main"],
      staging: ["main"],
    },
  },
};

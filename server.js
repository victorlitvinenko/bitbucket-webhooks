const express = require("express");
const axios = require("axios");
const config = require("./config");

const app = express();
app.use(express.json());

const PORT = config.port;
const WEBHOOKS = config.webhooks;

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

async function sendToDiscord(webhookUrl, message) {
  try {
    if (!webhookUrl || webhookUrl.includes("YOUR_")) {
      console.log("⚠️ Webhook не настроен, пропускаем");
      return;
    }
    await axios.post(webhookUrl, message);
    console.log("✅ Отправлено в Discord");
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  }
}

function formatCommitMessage(commit, repository, branch) {
  return {
    username: "Bitbucket Bot",
    avatar_url:
      "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/44_Bitbucket_logo_logos-512.png",
    embeds: [
      {
        title: "🔔 Новый коммит",
        description: commit.message || "",
        color: 0x0052cc,
        fields: [
          {
            name: "👤 Автор",
            value:
              commit.author.raw ||
              commit.author.user?.display_name ||
              "Неизвестно",
            inline: true,
          },
          {
            name: "📦 Репозиторий",
            value: repository,
            inline: true,
          },
          {
            name: "🌿 Ветка",
            value: branch || "неизвестна",
            inline: true,
          },
          {
            name: "🔗 Хэш",
            value: `\`${commit.hash.substring(0, 7)}\``,
            inline: true,
          },
        ],
        url: commit.links?.html?.href || "",
        timestamp: commit.date || new Date().toISOString(),
        footer: {
          text: "Bitbucket",
        },
      },
    ],
  };
}

function formatPRMessage(pr, action) {
  let color = 0x0052cc;
  let emoji = "📋";

  if (action === "MERGED") {
    color = 0x28a745;
    emoji = "✅";
  } else if (action === "DECLINED") {
    color = 0xdc3545;
    emoji = "❌";
  }

  return {
    username: "Bitbucket Bot",
    avatar_url:
      "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/44_Bitbucket_logo_logos-512.png",
    embeds: [
      {
        title: `${emoji} Pull Request: ${pr.title}`,
        description: pr.description || "",
        color: color,
        fields: [
          {
            name: "👤 Автор",
            value: pr.author.display_name,
            inline: true,
          },
          {
            name: "📊 Статус",
            value: action,
            inline: true,
          },
          {
            name: "🌿 Ветки",
            value: `${pr.source.branch.name} → ${pr.destination.branch.name}`,
            inline: false,
          },
        ],
        url: pr.links.html.href,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// Определение целевых каналов на основе контекста
function determineTargetChannels(data) {
  const channels = new Set(["main"]); // Всегда в main
  const repository = (data.repository?.full_name || "").toLowerCase();

  // По репозиторию
  for (const [repoKey, channelList] of Object.entries(
    config.routing.byRepository
  )) {
    if (repository.includes(repoKey)) {
      channelList.forEach((ch) => channels.add(ch));
    }
  }

  // По типу события
  if (data.push) {
    config.routing.byEvent.commit.forEach((ch) => channels.add(ch));

    // По ветке
    const branch = data.push.changes?.[0]?.new?.name?.toLowerCase() || "";
    for (const [branchKey, channelList] of Object.entries(
      config.routing.byBranch
    )) {
      if (branch === branchKey) {
        channelList.forEach((ch) => channels.add(ch));
      }
    }
  } else if (data.pullrequest) {
    const action = data.pullrequest.state;

    if (action === "OPEN") {
      config.routing.byEvent.pr_created.forEach((ch) => channels.add(ch));
    } else if (action === "MERGED") {
      config.routing.byEvent.pr_merged.forEach((ch) => channels.add(ch));
    } else if (action === "DECLINED") {
      config.routing.byEvent.pr_declined.forEach((ch) => channels.add(ch));
    }
  }

  return Array.from(channels).filter((ch) => WEBHOOKS[ch]);
}

// ============================================
// ЭНДПОИНТЫ
// ============================================

// 1. Отправка в конкретный канал
app.post("/webhook/:channel", async (req, res) => {
  try {
    const channel = req.params.channel;
    const data = req.body;

    console.log(`📥 Вебхук для канала: ${channel}`);

    if (!WEBHOOKS[channel]) {
      return res.status(404).send("Channel not found");
    }

    if (data.push && data.push.changes) {
      const repository = data.repository.full_name;
      const changes = data.push.changes;

      for (const change of changes) {
        const commits = change.commits || [];
        const branch = change.new?.name;

        // Отправляем только первый коммит
        if (commits.length > 0) {
          const commit = commits[0];
          const message = formatCommitMessage(commit, repository, branch);
          await sendToDiscord(WEBHOOKS[channel], message);
        }
      }
    } else if (data.pullrequest) {
      const pr = data.pullrequest;
      const message = formatPRMessage(pr, pr.state);
      await sendToDiscord(WEBHOOKS[channel], message);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    res.status(500).send("Error");
  }
});

// 2. Умная маршрутизация (РЕКОМЕНДУЕТСЯ)
app.post("/webhook-smart", async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Умная маршрутизация");

    const targetChannels = determineTargetChannels(data);
    console.log(`📤 Целевые каналы: ${targetChannels.join(", ")}`);

    if (data.push && data.push.changes) {
      const repository = data.repository.full_name;
      const changes = data.push.changes;

      for (const change of changes) {
        const commits = change.commits || [];
        const branch = change.new?.name;

        // Отправляем только первый коммит
        if (commits.length > 0) {
          const commit = commits[0];
          const message = formatCommitMessage(commit, repository, branch);

          for (const channel of targetChannels) {
            await sendToDiscord(WEBHOOKS[channel], message);
          }
        }
      }
    } else if (data.pullrequest) {
      const pr = data.pullrequest;
      const message = formatPRMessage(pr, pr.state);

      for (const channel of targetChannels) {
        await sendToDiscord(WEBHOOKS[channel], message);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    res.status(500).send("Error");
  }
});

// 3. Отправка во все каналы
app.post("/webhook-all", async (req, res) => {
  try {
    const data = req.body;
    console.log("📥 Отправка во все каналы");

    if (data.push && data.push.changes) {
      const repository = data.repository.full_name;
      const changes = data.push.changes;

      for (const change of changes) {
        const commits = change.commits || [];
        const branch = change.new?.name;

        // Отправляем только первый коммит
        if (commits.length > 0) {
          const commit = commits[0];
          const message = formatCommitMessage(commit, repository, branch);

          for (const webhookUrl of Object.values(WEBHOOKS)) {
            await sendToDiscord(webhookUrl, message);
          }
        }
      }
    } else if (data.pullrequest) {
      const pr = data.pullrequest;
      const message = formatPRMessage(pr, pr.state);

      for (const webhookUrl of Object.values(WEBHOOKS)) {
        await sendToDiscord(webhookUrl, message);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    res.status(500).send("Error");
  }
});

// ============================================
// ИНФОРМАЦИОННЫЕ И ТЕСТОВЫЕ ЭНДПОИНТЫ
// ============================================

app.get("/", (req, res) => {
  res.send(`
        <h1>Bitbucket → Discord Bridge 🚀</h1>
        <h2>Эндпоинты для Bitbucket:</h2>
        <ul>
            <li><b>POST /webhook/:channel</b> - Конкретный канал</li>
            <li><b>POST /webhook-smart</b> - 🌟 Умная маршрутизация (рекомендуется)</li>
            <li><b>POST /webhook-all</b> - Все каналы</li>
        </ul>
        <h2>Тестовые эндпоинты:</h2>
        <ul>
            <li><a href="/channels">GET /channels</a> - Список каналов</li>
            <li><a href="/test-all">GET /test-all</a> - Тест всех каналов</li>
            <li>GET /test/:channel - Тест конкретного канала</li>
        </ul>
    `);
});

// app.get("/channels", (req, res) => {
//   const channels = Object.keys(WEBHOOKS).map((key) => ({
//     name: key,
//     configured: !WEBHOOKS[key].includes("YOUR_"),
//     url: WEBHOOKS[key].includes("YOUR_") ? "не настроен" : "настроен",
//   }));

//   res.json({
//     channels: channels,
//     routing: config.routing,
//     endpoints: {
//       specific: "POST /webhook/:channel",
//       smart: "POST /webhook-smart (рекомендуется)",
//       all: "POST /webhook-all",
//     },
//   });
// });

// app.get("/test/:channel", async (req, res) => {
//   try {
//     const channel = req.params.channel;

//     if (!WEBHOOKS[channel]) {
//       return res.status(404).send(`Канал "${channel}" не найден`);
//     }

//     await sendToDiscord(WEBHOOKS[channel], {
//       content: `✅ Тест канала **${channel}**!`,
//       embeds: [
//         {
//           title: "Тестовое уведомление",
//           description:
//             "Если вы видите это сообщение, webhook работает правильно!",
//           color: 0x00ff00,
//           timestamp: new Date().toISOString(),
//         },
//       ],
//     });

//     res.send(`✅ Тестовое сообщение отправлено в канал: ${channel}`);
//   } catch (error) {
//     res.status(500).send("Ошибка: " + error.message);
//   }
// });

// app.get("/test-all", async (req, res) => {
//   try {
//     let sent = 0;
//     for (const [channel, webhookUrl] of Object.entries(WEBHOOKS)) {
//       if (!webhookUrl.includes("YOUR_")) {
//         await sendToDiscord(webhookUrl, {
//           content: `✅ Тест канала **${channel}**!`,
//         });
//         sent++;
//       }
//     }
//     res.send(`✅ Отправлено тестовых сообщений: ${sent}`);
//   } catch (error) {
//     res.status(500).send("Ошибка: " + error.message);
//   }
// });

// ============================================
// ЗАПУСК
// ============================================

app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}\n`);
  console.log(`📋 Настроенные каналы:`);

  for (const [channel, webhookUrl] of Object.entries(WEBHOOKS)) {
    const status = webhookUrl.includes("YOUR_") ? "❌" : "✅";
    console.log(`   ${status} ${channel}`);
  }

  console.log(`\n🌐 Рекомендуемый URL для Bitbucket:`);
  console.log(`   POST http://your-domain.com/webhook-smart`);
});

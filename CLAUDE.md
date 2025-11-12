# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**bitbucket-discord-bridge** is a lightweight Node.js webhook integration service that routes Bitbucket repository events (commits, pull requests) to multiple Discord channels. It uses smart routing rules to determine which Discord channels should receive notifications based on repository name, event type, and branch.

**Tech Stack:** Node.js, Express.js, Axios
**Language:** Plain JavaScript (no TypeScript or transpilation)
**Size:** ~400 lines of code (2 main files), ~1300 lines of documentation

## Common Commands

```bash
# Install dependencies
npm install

# Start server (production)
npm start

# Start with auto-reload on file changes (development)
npm run dev
```

**Default Port:** 4001 (configurable via `PORT` environment variable)

## Testing the Integration

The application includes built-in HTTP endpoints for manual testing:

```bash
# List all configured Discord channels and routing rules
curl http://localhost:3000/channels

# Send test message to a specific channel
curl http://localhost:3000/test/main

# Send test messages to all configured channels
curl http://localhost:3000/test-all

# Manual webhook trigger (requires proper Bitbucket event payload)
curl -X POST http://localhost:3000/webhook-smart -d @payload.json
```

**No automated test framework is configured.** Add tests using Jest or Mocha if needed.

## Architecture & Data Flow

### Three Webhook Endpoints

1. **`POST /webhook/:channel`** - Direct routing to a single channel
   - Send all events to a specific Discord channel
   - URL pattern: `/webhook/main`, `/webhook/frontend`, etc.

2. **`POST /webhook-smart`** - Intelligent multi-channel routing (RECOMMENDED)
   - Analyzes incoming Bitbucket event
   - Determines target channels based on routing rules
   - Sends to multiple Discord channels concurrently

3. **`POST /webhook-all`** - Broadcast to all channels
   - Sends webhook to every configured Discord channel
   - Useful for critical announcements

### Event Processing Logic

**server.js:119-160** contains `determineTargetChannels()` which routes events using this priority:
1. Always routes to 'main' channel
2. Checks `config.routing.byRepository` - matches if repo name contains a routing key
3. For push events: checks `config.routing.byEvent.commit` rules
4. For push events: checks `config.routing.byBranch` - exact branch name match (case-sensitive)
5. For PR events: checks `config.routing.byEvent.pr_created/pr_merged/pr_declined` based on PR state
6. Deduplicates channels using a Set, filters to only configured webhooks

**Event payload parsing:**
- Commits: `data.push.changes[0]` contains branch and commit info
- Pull requests: `data.pullrequest` contains PR state, title, source/destination branches

### Message Formatting

**server.js:28-116** contains two formatters:

- `formatCommitMessage()` (line 28) - Creates Discord embed with author, repo, branch, commit hash, link
  - Color: Blue (#0052cc)
  - Timestamp from commit date

- `formatPRMessage()` (line 73) - Creates Discord embed with PR title, branches, author
  - Color: Blue (#0052cc) for OPEN, Green (#28a745) for MERGED, Red (#dc3545) for DECLINED
  - Emoji indicates action status (📋, ✅, ❌)

Both use Bitbucket bot avatar and Discord embeds for rich formatting.

## Configuration

**config.js** is the only configuration file - no environment files (.env) are currently implemented.

### Structure

```javascript
module.exports = {
  port: process.env.PORT || 4001,

  webhooks: {
    main: "https://discord.com/api/webhooks/...",
    commits: "https://discord.com/api/webhooks/...",
    // ... more Discord webhook URLs
  },

  routing: {
    byRepository: {
      "frontend": ["frontend", "commits"],  // Send frontend/* repos to these channels
      "api": ["backend", "commits"]         // Send api/* repos to these channels
    },
    byEvent: {
      commit: ["commits"],                   // All commits go here
      pr_created: ["pullrequests"],
      pr_merged: ["pullrequests"],
      pr_declined: []                        // Ignored decline events
    },
    byBranch: {
      "main": ["important", "main"],        // main branch → important + main
      "master": ["important", "main"]
    }
  }
}
```

### Environment Variables

- `PORT` - Server port (default: 4001)
- Can use `process.env.DISCORD_*` for webhook URLs (good for production)

**Security note:** Discord webhook URLs are currently stored in config.js. For production, implement `dotenv` package and move secrets to `.env` file (already gitignored).

## File Structure

- **server.js** (380 lines) - Main Express app, webhook handlers, message formatting, routing logic
- **config.js** (46 lines) - Configuration file with webhooks and routing rules
- **package.json** - Dependencies: express, axios, nodemon
- **README.md** (Russian) - Comprehensive configuration guide with setup examples
- **EXAMPLES.md** (Russian) - Real-world configuration scenarios

## Debugging

The application logs comprehensively to console:
- Incoming webhook events show parsed data
- `determineTargetChannels()` returns target channel list
- Discord HTTP requests show success/failure
- Unconfigured webhooks are logged with warnings

**Console output example:**
```
📥 Умная маршрутизация
📤 Целевые каналы: main, frontend, commits
✅ Отправлено в Discord
```

## Key Points for Development

1. **No TypeScript** - This is plain JavaScript. Avoid adding build steps unless necessary.

2. **Webhook validation** - Bitbucket payload structure:
   - Commits: Check `data.push` exists, branch in `data.push.changes[0].new.name`
   - PRs: Check `data.pullrequest` exists, state in `data.pullrequest.state`

3. **Discord webhook format** - Must use `embeds` array with proper structure (see formatters in server.js:28-116)

4. **Routing deduplication** - Uses JavaScript Set to prevent duplicate Discord messages when multiple rules match

5. **Error handling** - Graceful: unconfigured webhooks are skipped, errors logged but don't crash server

6. **Case sensitivity** - Repository name matching is case-insensitive, branch matching is case-sensitive

## Future Improvements

- Add request signature verification from Bitbucket
- Implement dotenv for secrets management
- Add rate limiting (express-rate-limit)
- Add automated test suite
- Implement structured logging (winston/pino)
- Add health check endpoint
- Docker containerization
- PM2 or systemd configuration for production

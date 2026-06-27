// update-counter.js
//
// Fetches the Jurnlists Roblox group's member count and, if it has changed
// since the last run, posts an announcement embed to Discord via webhook.
//
// State (the last known member count) is stored in state.json and committed
// back to the repo by the GitHub Actions workflow, so the script "remembers"
// the previous count between runs.

const fs = require("fs");
const path = require("path");

const GROUP_ID = process.env.ROBLOX_GROUP_ID || "11867970"; // Jurnlists
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const EMBED_COLOR_HEX = process.env.EMBED_COLOR_HEX || "#f3b359";
const GROUP_NAME = process.env.GROUP_DISPLAY_NAME || "Jurnlists";
const CELEBRATION_EMOJI = process.env.CELEBRATION_EMOJI || "<:celebration:1417757294107820132>";

const STATE_FILE = path.join(__dirname, "state.json");

function hexToDecimal(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

async function getRobloxMemberCount(groupId) {
  const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`);
  if (!res.ok) {
    throw new Error(`Roblox API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    name: data.name,
    memberCount: data.memberCount,
  };
}

function readLastCount() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed.lastCount === "number" ? parsed.lastCount : null;
  } catch (err) {
    return null; // no state file yet, first run
  }
}

function writeLastCount(count) {
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ lastCount: count, updatedAt: new Date().toISOString() }, null, 2)
  );
}

async function postAnnouncementEmbed(memberCount) {
  const body = {
    embeds: [
      {
        description: `${CELEBRATION_EMOJI} **${GROUP_NAME}** has reached **${memberCount.toLocaleString()}** members!`,
        color: hexToDecimal(EMBED_COLOR_HEX),
      },
    ],
  };

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook error: ${res.status} ${text}`);
  }
}

async function main() {
  if (!WEBHOOK_URL) {
    throw new Error("Missing DISCORD_WEBHOOK_URL secret/env var.");
  }

  const { name, memberCount } = await getRobloxMemberCount(GROUP_ID);
  console.log(`Fetched: ${name} -> ${memberCount} members`);

  const lastCount = readLastCount();
  console.log(`Last known count: ${lastCount}`);

  if (lastCount === memberCount) {
    console.log("Count unchanged. Skipping Discord post.");
    return;
  }

  await postAnnouncementEmbed(memberCount);
  console.log("Posted update to Discord.");

  writeLastCount(memberCount);
  console.log("Updated state.json with new count.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

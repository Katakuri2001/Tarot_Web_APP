/**
 * Idempotent seed: 78 tarot cards, initial admin, default settings.
 * Run: npx tsx scripts/seed.ts (uses --local by default; --remote for production)
 */
import { tarotCards } from "../data/tarotCards";

interface SeedCard {
  id: string; name: string; arcana: string; suit: string; number: number;
  keywords: string[]; symbolism: string; uprightMeaning: string; reversedMeaning: string;
  loveUpright: string; loveReversed: string; careerUpright: string; careerReversed: string;
  generalUpright: string; generalReversed: string; advice: string;
}

async function run() {
  const remote = process.argv.includes("--remote");
  const { execSync } = await import("node:child_process");
  const args = remote ? "--remote" : "--local";
  const config = "-c wrangler.admin.toml";

  const sqlParts: string[] = [];

  for (const card of tarotCards as SeedCard[]) {
    const esc = (s: string) => s.replace(/'/g, "''");
    const keywords = JSON.stringify(card.keywords).replace(/'/g, "''");
    sqlParts.push(
      `INSERT INTO tarot_cards (id, name, slug, arcana, suit, number, keywords, symbolism, uprightMeaning, reversedMeaning, loveUpright, loveReversed, careerUpright, careerReversed, generalUpright, generalReversed, advice, isActive)
       VALUES ('${card.id}', '${esc(card.name)}', '${card.id}', '${card.arcana}', '${card.suit}', ${card.number}, '${keywords}', '${esc(card.symbolism)}', '${esc(card.uprightMeaning)}', '${esc(card.reversedMeaning)}', '${esc(card.loveUpright)}', '${esc(card.loveReversed)}', '${esc(card.careerUpright)}', '${esc(card.careerReversed)}', '${esc(card.generalUpright)}', '${esc(card.generalReversed)}', '${esc(card.advice)}', 1)
       ON CONFLICT(id) DO NOTHING;`
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@velora.local";
  const adminName = process.env.ADMIN_NAME || "Velora Admin";
  const { hashPassword } = await import("../worker/src/utils/password");
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme-velora-2026";
  const hash = await hashPassword(adminPassword);
  const adminId = crypto.randomUUID();
  sqlParts.push(
    `INSERT INTO users (id, email, name, passwordHash, role, isActive)
     VALUES ('${adminId}', '${adminEmail}', '${adminName}', '${hash}', 'admin', 1)
     ON CONFLICT(email) DO NOTHING;`
  );

  const settings: Record<string, string> = {
    websiteName: "Velora",
    tagline: "Discover what the cards reveal.",
    readingsEnabled: "true",
    maintenanceMode: "false",
    soundEnabled: "true",
    animationsEnabled: "true",
  };
  for (const [key, value] of Object.entries(settings)) {
    sqlParts.push(
      `INSERT INTO admin_settings (key, value) VALUES ('${key}', '${value}')
       ON CONFLICT(key) DO NOTHING;`
    );
  }

  const sql = sqlParts.join("\n");
  const { writeFileSync } = await import("node:fs");
  writeFileSync("/tmp/opencode/seed.sql", sql);

  console.log("Executing seed...");
  execSync(`npx wrangler d1 execute DB ${args} --file=/tmp/opencode/seed.sql ${config}`, { stdio: "inherit", cwd: process.cwd() });
  console.log("Seed complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

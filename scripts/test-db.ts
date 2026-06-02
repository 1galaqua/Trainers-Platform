import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

const STANDARD_URL =
  "mongodb://galaqua:123456%3F%21@ac-gmpwnil-shard-00-00.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-01.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-02.iwqknwa.mongodb.net:27017/trainers_platform?ssl=true&replicaSet=atlas-gcas9s-shard-0&authSource=admin&retryWrites=true&w=majority";

function loadSrvUrl() {
  const content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  const match = content.match(/DATABASE_URL="([^"]+)"/);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1];
}

async function tryConnect(label: string, uri: string) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const count = await client.db("trainers_platform").collection("User").countDocuments();
    console.log(`${label}: OK — User documents:`, count);
    return true;
  } catch (e) {
    console.error(`${label}: FAIL —`, e instanceof Error ? e.message : e);
    return false;
  } finally {
    await client.close().catch(() => {});
  }
}

async function main() {
  console.log("1) SRV (mongodb+srv) — needs DNS SRV support:\n");
  await tryConnect("SRV", loadSrvUrl());
  console.log("\n2) Standard (explicit hosts) — works without SRV DNS:\n");
  await tryConnect("Standard", STANDARD_URL);
}

main();

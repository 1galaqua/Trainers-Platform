import { MongoClient } from "mongodb";

const URLS: Record<string, string> = {
  standard:
    "mongodb://galaqua:123456%3F%21@ac-gmpwnil-shard-00-00.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-01.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-02.iwqknwa.mongodb.net:27017/trainers_platform?ssl=true&replicaSet=atlas-gcas9s-shard-0&authSource=admin&retryWrites=true&w=majority",
  direct:
    "mongodb://galaqua:123456%3F%21@ac-gmpwnil-shard-00-00.iwqknwa.mongodb.net:27017/trainers_platform?ssl=true&directConnection=true&authSource=admin",
  local: "mongodb://127.0.0.1:27017/trainers_platform",
};

async function tryConnect(label: string, uri: string) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const count = await client.db("trainers_platform").collection("User").countDocuments();
    console.log(`${label}: OK (${count} users)`);
    return true;
  } catch (e) {
    console.error(`${label}: FAIL —`, e instanceof Error ? e.message.split("\n")[0] : e);
    return false;
  } finally {
    await client.close().catch(() => {});
  }
}

async function main() {
  for (const [label, uri] of Object.entries(URLS)) {
    await tryConnect(label, uri);
  }
}

main();

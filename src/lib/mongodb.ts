import { MongoClient } from "mongodb";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClientPromise(): Promise<MongoClient> {
  if (!global.mongoClientPromise) {
    const client = new MongoClient(getDatabaseUrl());
    global.mongoClientPromise = client.connect();
  }
  return global.mongoClientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClientPromise();
  return client.db();
}

// MongoDB configuration
// Default: "mongodb://admin:admin@localhost:27017"
const MONGO_HOSTNAME = process.env.MONGO_HOSTNAME || process.env["MONGO_HOST"];
const MONGO_PORT = process.env.MONGO_PORT || "27017";

console.warn(process.env['MONGO_HOST']);

export const mongo_url = `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}`;
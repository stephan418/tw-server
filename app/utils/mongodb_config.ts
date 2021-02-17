// MongoDB configuration
// Default: "mongodb://admin:admin@localhost:27017"
const MONGO_HOSTNAME = process.env.MONGO_HOSTNAME || "localhost";
const MONGO_USERNAME = process.env.MONGO_USERNAME || "admin";
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "password";
const MONGO_PORT = process.env.MONGO_PORT || "27017";

export const mongo_url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}`;
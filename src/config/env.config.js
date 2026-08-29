import dotenv from "dotenv";
dotenv.config();

const config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGO_URI,
};

if (!config.port) {
  console.error("Falta PORT en el archivo .env");
  process.exit(1);
}

if (!config.nodeEnv) {
  console.error("Falta NODE_ENV en el archivo .env");
  process.exit(1);
}

if (!config.mongoUri) {
  console.error("Falta MONGO_URI en el archivo .env");
  process.exit(1);
}

export default config;

import mongoose from "mongoose";
import config from "./env.config.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error.message);
    process.exit(1);
  }
};

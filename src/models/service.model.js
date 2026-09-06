import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true, lowercase: true },
  available: { type: Boolean, required: true },
});

export default mongoose.model("Service", serviceSchema);

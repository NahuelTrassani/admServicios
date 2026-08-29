import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, required: true },
  services: [
    {
      service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      quantity: { type: Number, default: 1 },
      _id: false,
    },
  ],
});

export default mongoose.model("Booking", bookingSchema);

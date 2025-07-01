import mongoose from "mongoose";

const ProcessImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  order: { type: Number, required: true },
});

export default mongoose.model("ProcessImage", ProcessImageSchema);

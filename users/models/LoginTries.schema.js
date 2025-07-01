import { Schema, model } from "mongoose";

const LoginTries = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  lastLoginDate: {
    type: String,
    required: true,
  },
  tries: {
    type: Number,
    required: true,
  },
});

export default model("lockUser", LoginTries);

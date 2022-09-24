import mongoose from "mongoose";

export const User = mongoose.model("User", {
  name: String,
  email: String,
  service: String,
  password: String,
  isOng: Boolean
});

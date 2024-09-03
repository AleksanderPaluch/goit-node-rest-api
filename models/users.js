import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Пароль потрібен тільки для не-OAuth користувачів
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    name: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: null,
    },
    weight: {
      type: Number,
      default: null,
    },
    timeActivity: {
      type: String,
      default: null,
    },
    dailyNorma: {
      type: Number,
      default: 2000,
    },
    avatarURL: {
      type: String,
      default: null,
    },
    token: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },

    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: function () {
        return !this.googleId; // VerificationToken потрібен тільки для не-OAuth користувачів
      },
    },
  },

  { versionKey: false, timestamps: true }
);

export default mongoose.model("User", userSchema); // User => users

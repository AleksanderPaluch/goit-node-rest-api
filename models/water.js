import mongoose from "mongoose";

const waterSchema = mongoose.Schema(
    {
      time: {
        type: String,
        required: true,
      },
      date: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { versionKey: false,
      timestamps: true,
     }
  );
  
  export default mongoose.model("Water", waterSchema); // Water => waters
  
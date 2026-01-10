import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.model.js";

dotenv.config();

const seedCreator = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const creatorEmail = "creator@mini.com";
    const creatorPassword = "creator123";

    // Check if creator already exists
    const creatorExists = await User.findOne({ email: creatorEmail });

    if (creatorExists) {
      console.log("ℹ️  Creator already exists");
      console.log("Email:", creatorExists.email);
      console.log("Role:", creatorExists.role);
      process.exit(0);
    }

    // Create creator
    const creator = await User.create({
      name: "Creator",
      email: creatorEmail,
      password: creatorPassword,
      role: "creator",
    });

    console.log("✅ Creator seeded successfully!");
    console.log("Email:", creator.email);
    console.log("Password:", creatorPassword);
    console.log("Role:", creator.role);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding creator:", error);
    process.exit(1);
  }
};

seedCreator();

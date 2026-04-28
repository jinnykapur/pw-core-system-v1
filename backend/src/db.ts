import mongoose from "mongoose";

export async function connectToDatabase(mongoUri: string) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error";
    throw new Error(
      [
        `Could not connect to MongoDB at ${mongoUri}.`,
        "For local macOS development, install and start MongoDB with:",
        "brew tap mongodb/brew",
        "brew install mongodb-community",
        "brew services start mongodb-community",
        `Original error: ${message}`
      ].join("\n")
    );
  }
}

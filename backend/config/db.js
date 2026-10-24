import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'art_studio',
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed cleanly.');
  } catch (error) {
    console.error('[Database Error] Error during MongoDB disconnect:', error);
  }
};

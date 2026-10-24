import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas first; start HTTP server ONLY after database connection succeeds
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`  Art Studio Backend Server is Running!  `);
      console.log(`  Port: ${PORT}                           `);
      console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Database: Connected                     `);
      console.log(`=========================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Fatal: Failed to connect to MongoDB. Server not started.', err.message);
    process.exit(1);
  });

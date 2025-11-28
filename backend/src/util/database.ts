import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not set');
    }
    const user = process.env.MONGODB_USER;
    if (!user) {
      throw new Error('MONGODB_USER not set');
    }
    const pass = process.env.MONGODB_PASS;
    if (!pass) {
      throw new Error('MONGODB_PASS not set');
    }

    await mongoose.connect(uri, {
      auth: {
        username: user,
        password: pass,
      },
      authSource: 'admin', // Authentication database - configured automatically by the MongoDB docker image
    });

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', error => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', () => {
      mongoose.connection
        .close()
        .then(() => {
          console.log('MongoDB connection closed through app termination');
          process.exitCode = 0;
        })
        .catch((error: unknown) => {
          console.error(
            'Failed to close MongoDB connection through app termination',
            error
          );
        });
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exitCode = 1;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

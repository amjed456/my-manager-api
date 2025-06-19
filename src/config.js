// Configuration variables
module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://amjed:1234@cluster0.r5pekjh.mongodb.net/my-manager?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'project_manager_secure_jwt_token_2023',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // MongoDB Connection Options for Performance
  MONGODB_OPTIONS: {
    // Connection Pool Settings
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2,  // Minimum number of connections in the pool
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    
    // Connection Settings
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // How long a send or receive on a socket can take
    connectTimeoutMS: 10000, // How long to wait for a connection to be established
    
    // Retry Settings
    retryWrites: true,
    retryReads: true,
    
    // Write Concern for Performance
    w: 'majority',
    
    // Read Preference for Performance
    readPreference: 'primaryPreferred',
    
    // Compression
    compressors: ['zlib'],
    
    // Heartbeat
    heartbeatFrequencyMS: 10000,
    
    // Auto Index - only in development
    autoIndex: process.env.NODE_ENV !== 'production'
  }
}; 
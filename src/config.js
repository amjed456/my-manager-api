// Configuration variables
module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://amjed:1234@cluster0.r5pekjh.mongodb.net/my-manager?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'project_manager_secure_jwt_token_2023',
  NODE_ENV: process.env.NODE_ENV || 'development'
}; 
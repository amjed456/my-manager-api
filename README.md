# My Manager API

Backend API for the Project Management Application.

## Deployment to Render

### Prerequisites
- A Render account (https://render.com)
- Your MongoDB Atlas connection string
- A secure JWT secret

### Deployment Steps
1. Fork or clone this repository to your GitHub account
2. Log in to your Render account
3. Click "New" and select "Web Service"
4. Connect your GitHub repository
5. Configure your service:
   - Name: my-manager-api (or your preferred name)
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Set the following environment variables:
   - PORT: 5000
   - NODE_ENV: production
   - MONGODB_URI: Your MongoDB Atlas connection string
   - JWT_SECRET: Your secure JWT secret
7. Click "Create Web Service"

Your API will be deployed and available at the URL provided by Render.

## Local Development
```
npm install
npm run dev
```

## API Endpoints
- User management: `/api/users`
- Project management: `/api/projects`
- Task management: `/api/tasks`
- Notifications: `/api/notifications`
- Subscriptions: `/api/subscriptions` 
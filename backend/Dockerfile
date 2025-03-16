FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with build tools for bcrypt
RUN apk add --no-cache make gcc g++ python3 && \
    npm install && \
    apk del make gcc g++ python3

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 
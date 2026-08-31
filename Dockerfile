FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Expose Metro bundler and web ports
EXPOSE 8081

# Set environment variables for Expo CLI in container
ENV NODE_ENV=development
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Default command: launch Expo Metro bundler for Expo Go and Web
CMD ["npx", "expo", "start", "--go", "--port", "8081"]

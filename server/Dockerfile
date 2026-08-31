FROM node:20-alpine

WORKDIR /app/server

# Copy server package manifests
COPY server/package.json server/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy server source code
COPY server/ ./

# Expose server port
EXPOSE 3001

ENV NODE_ENV=development
ENV PORT=3001

# Default command: start server with watching enabled
CMD ["npm", "run", "dev"]

# Stage 1: Build frontend
FROM node:16 as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Stage 2: Set up backend with frontend build
FROM node:16
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend ./
# Create public directory and copy frontend build
RUN mkdir -p public
COPY --from=frontend-builder /app/build ./public

# Expose port and start app
EXPOSE 5000
CMD ["node", "server.js"]

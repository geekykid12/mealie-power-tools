# ─── Stage 1: Build React ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Install proxy server deps
COPY server/package.json ./server/
RUN cd server && npm install

COPY server/index.js ./server/

EXPOSE 3000

CMD ["node", "server/index.js"]

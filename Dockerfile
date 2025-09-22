# Multi-stage build for Akazify Core
FROM node:20-alpine AS builder

# Enable Corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm -r build

# Production stage
FROM node:20-alpine AS production

# Enable Corepack for pnpm
RUN corepack enable

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S akazify -u 1001

WORKDIR /app

# Copy built packages from builder stage
COPY --from=builder --chown=akazify:nodejs /app/packages ./packages
COPY --from=builder --chown=akazify:nodejs /app/package.json ./
COPY --from=builder --chown=akazify:nodejs /app/pnpm-workspace.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

USER akazify

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Placeholder command (replace with actual service entrypoint)
CMD ["node", "-e", "console.log('Akazify Core placeholder'); require('http').createServer((req, res) => { if(req.url === '/health') { res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify({status: 'ok'})); } else { res.writeHead(404); res.end(); } }).listen(8080, () => console.log('Server running on port 8080'));"]

FROM node:20-alpine


WORKDIR /app/server


COPY server/package*.json ./


RUN npm ci --omit=dev

# Copy application source
COPY server ./


EXPOSE 3000

# Run as the 'node' non-root user that comes with the official image
USER node

CMD ["node", "index.js"]
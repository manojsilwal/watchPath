FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build-time environment variables for Next.js
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Build Next.js application
# Note: Next.js reads NEXT_PUBLIC_* variables at build time if they are statically optimized.
# If you need dynamic runtime configuration, you must handle it in next.config.ts or use SSR.
RUN npm run build

EXPOSE 4000

# Start production server
CMD ["npm", "start"]

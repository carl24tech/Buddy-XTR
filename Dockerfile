FROM node:20-bookworm

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      imagemagick \
      webp && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (fix peer conflict)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy the rest of the app
COPY . .

# Expose app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]

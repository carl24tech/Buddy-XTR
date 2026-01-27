FROM node:20-bookworm

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
      ffmpeg \
      imagemagick \
      webp && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json only
COPY package.json ./

# Install dependencies
RUN npm install && npm install -g qrcode-terminal pm2

# Copy the rest of the app
COPY . .

# Expose app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]

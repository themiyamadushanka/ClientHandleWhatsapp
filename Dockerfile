FROM node:22-slim

# Install ffmpeg and curl for yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the bot
CMD ["node", "app.js"]

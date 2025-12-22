FROM oven/bun:latest

WORKDIR /app

# Install system dependencies for sharp (libvips and related libraries)
RUN apt-get update && apt-get install -y \
    libvips-dev \
    libglib2.0-0 \
    libexpat1 \
    libgsf-1-114 \
    libexif12 \
    libjpeg62-turbo \
    libpng16-16 \
    librsvg2-2 \
    libtiff5 \
    libwebp6 \
    libxml2 \
    && rm -rf /var/lib/apt/lists/*

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

# Install dependencies (sharp will install with correct platform binaries)
RUN bun install --production

COPY ./app ./app
COPY ./public ./public

RUN mkdir -p storage drive logs \
    && touch logs/server.log \
    && chmod -R 755 storage drive \
    && chmod -R 775 logs

# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai
ENV NODE_ENV=production

VOLUME ["/app/storage", "/app/drive", "/app/logs"]

EXPOSE 8180

CMD ["bun", "run", "app/index.ts"]

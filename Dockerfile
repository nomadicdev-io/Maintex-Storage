FROM oven/bun:latest AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock
COPY build.ts build.ts

RUN bun install --frozen-lockfile --production

RUN apt-get update && apt-get install -y \
    nasm \
    cmake \
    build-essential \
    python3 \
    make \
    ffmpeg \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY ./app ./app
COPY ./public ./public
COPY ./files ./files

ENV NODE_ENV=production

RUN bun run build

FROM oven/bun:latest AS runtime

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/files ./files

RUN apt-get update && apt-get install -y \
    su-exec \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/storage/uploads /app/storage/temp /app/storage/assets /app/drive /app/logs \
    && useradd -m appuser \
    && chown -R appuser:appuser /app \
    && chmod -R 775 /app/storage /app/drive /app/logs \
    && touch /app/logs/server.log \
    && chown appuser:appuser /app/logs/server.log \
    && chmod 664 /app/logs/server.log

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai
ENV NODE_ENV=production

VOLUME ["/app/storage", "/app/drive", "/app/logs"]

EXPOSE 8180

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "run", "build/index.js"]

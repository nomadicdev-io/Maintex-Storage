FROM oven/bun:1 AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock
COPY build.ts build.ts

RUN bun install --frozen-lockfile --production
RUN bun install bun-image-turbo-linux-arm64-gnu bun-image-turbo-linux-x64-gnu bun-image-turbo-linux-x64-musl

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

ENV NODE_ENV=production

RUN bun run build

FROM oven/bun:1 AS runtime

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

RUN mkdir -p storage drive logs \
    && touch logs/server.log \
    && chmod -R 755 storage drive \
    && chmod -R 775 logs \
    && chmod -R 775 public \
    && useradd -m appuser && chown -R appuser:appuser /app

# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai
ENV NODE_ENV=production

USER appuser

VOLUME ["/app/storage", "/app/drive", "/app/logs"]

EXPOSE 8180

CMD ["bun", "run", "build/index.js"]

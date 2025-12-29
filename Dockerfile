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

RUN mkdir -p storage drive logs \
    && chmod -R 755 storage drive \
    && useradd -m appuser && chown -R appuser:appuser /app \
    && touch /app/logs/server.log \
    && chown -R appuser:appuser /app/logs/server.log


# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai
ENV NODE_ENV=production

USER appuser

VOLUME ["/app/storage", "/app/drive", "/app/logs"]

EXPOSE 8180

CMD ["bun", "run", "build/index.js"]

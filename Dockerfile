FROM oven/bun:1.3.5-debian  AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

# Verify and ensure platform-specific native bindings are installed
RUN bun install bun-image-turbo-linux-x64-gnu bun-image-turbo-linux-arm64-gnu && \
    echo "Checking installed packages:" && \
    ls -la /app/node_modules/ | grep bun-image-turbo && \
    echo "Verification complete"

COPY ./app ./app
COPY ./public ./public

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	app/index.ts

RUN mkdir -p storage drive logs \
    && touch logs/server.log \
    && chmod -R 755 storage drive \
    && chmod -R 775 logs

# Prepare native bindings directory for copying to final stage
# Always create the directory with at least a marker file (to avoid COPY errors)
RUN mkdir -p /app/native-bindings && \
    ([ -d /app/node_modules/bun-image-turbo-linux-x64-gnu ] && cp -r /app/node_modules/bun-image-turbo-linux-x64-gnu /app/native-bindings/ || echo "x64-gnu not found") && \
    ([ -d /app/node_modules/bun-image-turbo-linux-arm64-gnu ] && cp -r /app/node_modules/bun-image-turbo-linux-arm64-gnu /app/native-bindings/ || echo "arm64-gnu not found") && \
    ([ -d /app/node_modules/bun-image-turbo ] && cp -r /app/node_modules/bun-image-turbo /app/native-bindings/ || echo "bun-image-turbo not found") && \
    (ls -la /app/native-bindings/ || touch /app/native-bindings/.keep) && \
    echo "Native bindings prepared"

FROM debian:bookworm-slim

WORKDIR /app

# Install necessary runtime libraries for native bindings
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/server ./server
COPY --from=build /app/public ./public
COPY --from=build /app/storage ./storage
COPY --from=build /app/drive ./drive
COPY --from=build /app/logs ./logs

# Copy native bindings for image-turbo from prepared directory
RUN mkdir -p ./node_modules
COPY --from=build /app/native-bindings/ ./node_modules/

# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai
ENV NODE_ENV=production

VOLUME ["/app/storage", "/app/drive", "/app/logs"]

EXPOSE 8180

CMD ["./server"]

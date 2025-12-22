FROM oven/bun:1.3.5-debian  AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install
RUN bun install bun-image-turbo-linux-x64-gnu bun-image-turbo-linux-arm64-gnu

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

# Copy native bindings for image-turbo
COPY --from=build /app/node_modules/bun-image-turbo-linux-x64-gnu ./node_modules/bun-image-turbo-linux-x64-gnu
COPY --from=build /app/node_modules/bun-image-turbo-linux-arm64-gnu ./node_modules/bun-image-turbo-linux-arm64-gnu
COPY --from=build /app/node_modules/bun-image-turbo ./node_modules/bun-image-turbo

# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai
ENV NODE_ENV=production

VOLUME ["/app/storage", "/app/drive", "/app/logs"]

EXPOSE 8180

CMD ["./server"]

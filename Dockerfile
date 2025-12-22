FROM oven/bun:latest AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install
RUN bun add --cpu=x64 --os=linux sharp

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

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server ./server
COPY --from=build /app/public ./public
COPY --from=build /app/storage ./storage
COPY --from=build /app/drive ./drive
COPY --from=build /app/logs ./logs

# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai
ENV NODE_ENV=production

VOLUME ["/app/storage", "/app/drive", "/app/logs"]

EXPOSE 8180

CMD ["./server"]

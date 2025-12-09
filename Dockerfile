FROM oven/bun:latest AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./app ./app
COPY ./public ./public

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	app/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server
COPY --from=build /app/storage ./storage
COPY --from=build /app/drive ./drive

RUN mkdir -p storage drive && \
    touch logs/server.log && \
    chown -R bun:bun /app && \
    chmod -R 755 storage drive && \
    chmod -R 775 logs

# Set timezone to Asia/Dubai
ENV TZ=Asia/Dubai

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 8180
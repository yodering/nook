FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate
RUN bun run build

EXPOSE 8080
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start -- --hostname 0.0.0.0 --port ${PORT:-8080}"]

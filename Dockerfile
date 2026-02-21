FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate
RUN bun run build

RUN bunx prisma migrate deploy

EXPOSE 3000
CMD ["bun", "run", "start"]

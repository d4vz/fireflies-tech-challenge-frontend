FROM oven/bun:1.3-debian

WORKDIR /app

COPY package.json bun.lock ./
ENV HUSKY=0
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHPACK_POLLING=true
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

EXPOSE 8080
CMD ["bun", "x", "next", "dev", "-H", "0.0.0.0", "-p", "8080"]

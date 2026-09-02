FROM oven/bun:1.3-debian

WORKDIR /app

COPY package.json bun.lock ./
ENV HUSKY=0
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

EXPOSE 8080
ENV PORT=8080
CMD ["bun", "run", "start"]

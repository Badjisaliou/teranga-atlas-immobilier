FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173 TAI_DATA_DIR=/data
RUN mkdir -p /data && chown node:node /data
COPY --from=build /app/dist/client ./dist/client
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules/nodemailer ./node_modules/nodemailer
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "apps/api/src/healthcheck.mjs"]
CMD ["node", "apps/api/src/container.mjs"]

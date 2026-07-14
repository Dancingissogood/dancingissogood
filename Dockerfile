# syntax=docker/dockerfile:1.7

FROM node:24.10.0-alpine AS build
WORKDIR /app

ADD --checksum=sha256:e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3 \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  /app/certs/rds-global-bundle.pem

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm ci

COPY backend backend
COPY packages/db packages/db
RUN npm run db:generate && npm run backend:build

FROM build AS migration
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "db:deploy"]

FROM node:24.10.0-alpine AS runtime-dependencies
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY packages/db/package.json packages/db/package.json
RUN npm ci --omit=dev --omit=optional --ignore-scripts && npm cache clean --force

FROM node:24.10.0-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=runtime-dependencies /app/node_modules node_modules
COPY --from=runtime-dependencies /app/package.json package.json
COPY --from=runtime-dependencies /app/backend/package.json backend/package.json
COPY --from=runtime-dependencies /app/packages/db/package.json packages/db/package.json
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/packages/db/dist packages/db/dist
COPY --from=build /app/certs certs

USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "backend/dist/src/server.js"]

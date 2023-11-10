# syntax=docker/dockerfile:1

################################################################################
# Use node image for base image for all stages.
ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-alpine as base
RUN apk update && apk add --no-cache dumb-init

# Set working directory for all build stages.
WORKDIR /usr/src/app
# RUN mkdir -p /usr/src/app/callsheet-api/upload
# RUN mkdir -p /usr/src/app/callsheet-api/data
# RUN mkdir -p /usr/src/app/callsheet-api/logs
# RUN chown -R node /usr/src/app

################################################################################
# Create a stage for installing production dependencies.
FROM base as deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Create a stage for building the application.
FROM deps as build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm run build --only=production

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base as final

RUN chown -R node /usr/src/app
# Use production node environment by default.
ENV NODE_ENV production

# Run the application as a non-root user.
USER node
#WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/callsheet-api/data/uploads
RUN mkdir -p /usr/src/app/callsheet-api/data/callsheets
RUN mkdir -p /usr/src/app/callsheet-api/data/logs
RUN chown -R node:node /usr/src/app/callsheet-api

# Copy package.json so that package manager commands can be used.
COPY --chown=node:node package.json .

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./callsheet-api
RUN chmod -R 755 /usr/src/app/callsheet-api/data/uploads
RUN chown -R node:node /usr/src/app/callsheet-api


# Expose the port that the application listens on.
EXPOSE 4000

HEALTHCHECK CMD curl --fail http://localhost:4000/health || exit 1  

# Run the application.
CMD node callsheet-api/server.js
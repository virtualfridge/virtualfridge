# TODO: figure out what node version to use
ARG NODE_VERSION=18

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

# Copy the rest of the source files into the image.
COPY --chown=node . .

# Install typescript compiler
RUN npm i -g typescript
# RUN npm ci --omit=dev && npm run build
RUN npm ci
RUN npm run build

# Run the application as a non-root user.
# USER node

# Expose the ports
EXPOSE $PORT

# Run the application.
# TODO: check this is the correct command
CMD npm run start

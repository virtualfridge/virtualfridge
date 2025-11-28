ARG NODE_VERSION=18
ARG PORT=80

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

COPY --chown=node package.json package-lock.json ./

# Install node modules
RUN npm i

# Copy the source files into the image.
COPY --chown=node . .

RUN npm run build

# Run the application as a non-root user.
# TODO: make this work properly; for now we can run as root
# USER node

# Expose the port
# TODO: support HTTPS and HTTP->HTTPS redirects for prod
EXPOSE $PORT

# Run the application.
CMD npm run start

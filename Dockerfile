FROM node:current-alpine3.16

# Copy the package.json and package-lock.json (if available) to the container
COPY package*.json .

# Install dependencies
RUN npm i

# Copy the application code to the container
COPY . .

# Specify the command to run when the container starts
CMD node index
FROM node:18-alpine
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Ensure the container listens on the correct port
EXPOSE 5173

CMD ["npm", "run", "dev"]
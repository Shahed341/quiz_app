FROM node:18-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy the rest of the files
COPY . .

EXPOSE 5173

# Start Vite with the --host flag
CMD ["npm", "run", "dev", "--", "--host"]
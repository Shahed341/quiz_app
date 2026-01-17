# Use a slim version of Python for a smaller image size
FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Install system dependencies for PDF processing (like libmagic or poppler if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the processor code
COPY . .

# Create the uploads directory inside the container
RUN mkdir -p uploads

# This container will run as a persistent worker or an API
# For now, we'll assume it's an API (Flask/FastAPI) to make Node integration cleaner
CMD ["python", "processor.py"]
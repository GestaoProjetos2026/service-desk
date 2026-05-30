# Build stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (PostgreSQL client + libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Fix line endings (CRLF -> LF) and make entrypoint executable
RUN sed -i 's/\r$//' scripts/entrypoint.sh && chmod +x scripts/entrypoint.sh

# Expose port
EXPOSE 8000

# Health check (usa urllib da stdlib — `requests` não está instalado)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://api.service-desk.40.82.176.176.nip.io/health', timeout=5).status==200 else 1)" || exit 1

# Run migrations then start the server
ENTRYPOINT ["sh", "scripts/entrypoint.sh"]

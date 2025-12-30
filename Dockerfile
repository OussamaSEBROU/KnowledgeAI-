# Stage 1: Build the frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the backend and serve the frontend
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend from the previous stage
COPY --from=frontend-builder /app/dist ./dist

# Copy the backend code
COPY main.py .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "main.py"]

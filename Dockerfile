# Stage 1: Build the frontend
FROM node:18-alpine AS build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Stage 2: Build the backend and serve the app
FROM python:3.11-slim

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code and the built frontend
COPY backend/ ./backend/
COPY --from=build /app/frontend/dist ./static

RUN mkdir /data

WORKDIR /app/backend

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

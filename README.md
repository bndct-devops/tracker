# Tracker

A simple, modern, and self-hostable application to track daily habits and consumption.

## Features

- **Daily Tracking:** Add and track items you consume or activities you do throughout the day.
- **Real-time Updates:** The interface updates in real-time as you track items.
- **Time Since Last Event:** See how much time has passed since you last tracked an item.
- **CSV Export:** Export your entire tracking history to a CSV file.
- **Modern UI:** A clean and responsive interface with a Catppuccin Mocha theme.
- **Dockerized:** Includes a multi-stage Dockerfile for easy deployment.

## Tech Stack

- **Backend:** Python with FastAPI
- **Frontend:** React (with Vite)
- **Database:** SQLite

## Local Development

To run the application locally, you'll need to start both the backend and frontend servers.

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and install dependencies:
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  Start the development server:
    ```bash
    uvicorn main:app --reload
    ```
    The backend will be running at `http://localhost:8000`.

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will be running at `http://localhost:5173`.

## Docker Deployment

This project includes a multi-stage `Dockerfile` that builds the frontend and serves it with the backend in a single container.

1.  **Build the Docker image:**
    ```bash
    docker build -t tracker-app .
    ```
2.  **Run the Docker container:**
    ```bash
    docker run -d -p 8000:8000 -v $(pwd)/backend/tracker.db:/app/tracker.db --name tracker tracker-app
    ```
    This will start the application in detached mode and map port 8000 on your host to port 8000 in the container. It also mounts the `tracker.db` file to persist your data.

    The application will be accessible at `http://localhost:8000`.

## Unraid Deployment

To deploy this application on Unraid, you can follow these steps.

### 1. Build and Push the Docker Image

First, you need to build the Docker image and push it to a registry like Docker Hub.

```bash
# Build the image
docker build -t your-dockerhub-username/tracker-app .

# Log in to Docker Hub
docker login

# Push the image
docker push your-dockerhub-username/tracker-app
```
Replace `your-dockerhub-username` with your actual Docker Hub username.

### 2. Add the Container in Unraid

1.  Go to the **Docker** tab in your Unraid web UI.
2.  Click the **Add Container** button.
3.  Fill in the following details:
    -   **Name:** `Tracker` (or any name you prefer)
    -   **Repository:** `your-dockerhub-username/tracker-app` (the image you just pushed)
    -   **Network Type:** `Bridge`
    -   **Port:** Click **Add another Path, Port, Variable, Label or Device**.
        -   **Container Port:** `8000`
        -   **Host Port:** `8000` (or another available port on your Unraid server)
    -   **Path:** Click **Add another Path, Port, Variable, Label or Device**.
        -   **Container Path:** `/app/tracker.db`
        -   **Host Path:** `/mnt/user/appdata/tracker/tracker.db` (or another location where you want to store the database file). **Important:** You must create the `/mnt/user/appdata/tracker` directory on your Unraid server before starting the container.

4.  Click **Apply** to create and start the container.

The application will be accessible at `http://<your-unraid-ip>:<host-port>`.

## API Usage

The backend provides a simple REST API to track items. This is ideal for integrating with other services like iOS Shortcuts.

### Create an Event

-   **Endpoint:** `POST /events`
-   **Description:** Creates a new event for a trackable item.
-   **Body:**
    ```json
    {
      "item_name": "Coffee"
    }
    ```
-   **Example (using curl):**
    ```bash
    curl -X POST http://localhost:8000/events -H "Content-Type: application/json" -d '{"item_name": "Coffee"}'
    ```

### Get Today's Summary

-   **Endpoint:** `GET /items/today`
-   **Description:** Retrieves a summary of all items tracked today, including their counts and the timestamp of the last event.
-   **Example:**
    ```bash
    curl http://localhost:8000/items/today
    ```

### Get All Events

-   **Endpoint:** `GET /events/all`
-   **Description:** Retrieves a list of all events ever tracked. Useful for exporting data.
-   **Example:**
    ```bash
    curl http://localhost:8000/events/all
    ```

### Decrement an Item (Delete Latest Event)

-   **Endpoint:** `DELETE /items/{item_name}/latest`
-   **Description:** Deletes the most recent event for a specific item. This is used for the decrement functionality in the UI.
-   **Example:**
    ```bash
    curl -X DELETE http://localhost:8000/items/Coffee/latest
    ```

### Delete All Events for an Item

-   **Endpoint:** `DELETE /items/{item_name}`
-   **Description:** Deletes all events associated with a specific item.
-   **Example:**
    ```bash
    curl -X DELETE http://localhost:8000/items/Coffee
    ```

### iOS Shortcut Example: Track a Coffee

You can create a simple iOS Shortcut to track an item with a single tap. Here’s how to set it up to track "Coffee":

1.  Open the **Shortcuts** app on your iPhone or iPad.
2.  Create a new shortcut.
3.  Add the **Get Contents of URL** action.
4.  Configure the action as follows:
    -   **URL:** `http://<your-unraid-ip>:<host-port>/events` (replace with your actual server address).
    -   **Method:** `POST`
    -   **Headers:** Add a header with `Key: Content-Type` and `Value: application/json`.
    -   **Request Body:** Select `JSON` and add a field with `Key: item_name` and `Value: Coffee`.

Now, you can add this shortcut to your home screen for one-tap tracking.

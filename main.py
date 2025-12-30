import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI(title="Knowledge AI - Research Sanctuary")

# Serve static files from the 'dist' directory (where Vite builds the frontend)
dist_path = os.path.join(os.path.dirname(__file__), "dist")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Catch-all route to serve the frontend's index.html for client-side routing
@app.get("/{rest_of_path:path}")
async def serve_frontend(rest_of_path: str):
    # If the path is empty or just '/', serve index.html
    if not rest_of_path or rest_of_path == "/":
        return FileResponse(os.path.join(dist_path, "index.html"))

    file_path = os.path.join(dist_path, rest_of_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # Fallback to index.html for SPA routing
    return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

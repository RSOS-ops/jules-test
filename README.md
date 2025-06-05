# jules-test

A simple Three.js application that loads and displays a 3D GLB model (`HoodedCory_PlanarFace_BigWireframe.glb`) with basic scene setup, lighting, and orbit controls.

## Features

- Loads a GLB model (`HoodedCory_PlanarFace_BigWireframe.glb`) using `GLTFLoader`.
- Basic Three.js scene with a perspective camera and WebGL renderer.
- Interactive orbit controls (`OrbitControls`) for easy model manipulation (zoom, pan, rotate).
- Lighting setup:
    - `AmbientLight` for overall scene illumination.
    - `DirectionalLight` to simulate a distant light source.
    - `SpotLight` parented to the model to highlight it.
- Dynamic camera adjustment (`adjustCameraForModel` function) to ensure the model is well-framed.
- Responsive canvas that adapts to window resize events.
- Utilizes ES6 modules and an import map for Three.js dependency management directly in the browser, requiring no build step.

## How to Run

1.  **Clone the repository:**
    If you haven't already, clone the repository to your local machine.
    ```bash
    # Replace <repository_url> with the actual URL of the repository
    git clone <repository_url>
    cd jules-test
    ```

2.  **Serve the project using a local web server:**
    This project relies on ES6 modules and an import map. For these features to work correctly, you must serve the `index.html` file through a local HTTP server. Opening the `index.html` file directly via the `file:///` protocol in your browser will likely result in errors.

    Here are a couple of common ways to start a local server:

    *   **Using Python's `http.server` (Requires Python 3):**
        Navigate to the project's root directory in your terminal (the directory containing `index.html`) and execute:
        ```bash
        python -m http.server
        ```
        This will typically serve the project at `http://localhost:8000`.

    *   **Using `live-server` (Requires Node.js and npm):**
        First, install `live-server` globally if you haven't already:
        ```bash
        npm install -g live-server
        ```
        Then, navigate to the project's root directory in your terminal and run:
        ```bash
        live-server
        ```
        `live-server` will usually open the page in your default browser automatically and supports live reloading.

3.  **Open in your web browser:**
    Once the local server is running, open your web browser and navigate to the address provided by the server (e.g., `http://localhost:8000` or the one `live-server` indicates).

## Project Structure

```
.
├── index.html      # The main HTML file that sets up the page and import map.
├── main.js         # Contains all the Three.js logic for scene setup, model loading, controls, and rendering.
└── README.md       # This documentation file.
```
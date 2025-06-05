// Import necessary Three.js modules
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --------------------------------------------------------------------------------
// Scene Setup
// --------------------------------------------------------------------------------
// Create the main scene container for all 3D objects.
const scene = new THREE.Scene();
// Set background color to black.
scene.background = new THREE.Color(0x000000);

// --------------------------------------------------------------------------------
// Camera Setup
// --------------------------------------------------------------------------------
// Define a perspective camera for a 3D view.
// Parameters: FOV (75 degrees), aspect ratio, near clipping plane, far clipping plane.
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// --------------------------------------------------------------------------------
// Renderer Setup
// --------------------------------------------------------------------------------
// Create the WebGL renderer with antialiasing for smoother edges.
const renderer = new THREE.WebGLRenderer({ antialias: true });
// Set the renderer size to match the window dimensions.
renderer.setSize(window.innerWidth, window.innerHeight);
// Append the renderer's canvas element to the HTML body.
document.body.appendChild(renderer.domElement);

// --------------------------------------------------------------------------------
// Controls Setup
// --------------------------------------------------------------------------------
// Initialize OrbitControls for camera manipulation (zoom, pan, rotate).
let controls = new OrbitControls(camera, renderer.domElement);
// Set the point around which the camera will orbit (the model's center).
controls.target.set(0, 0, 0);
// Enable damping for smoother camera movement after user interaction.
controls.enableDamping = true;
// Set the damping factor (lower value means more gradual slowdown).
controls.dampingFactor = 0.05;
// Other OrbitControls settings like autoRotate or screenSpacePanning can be configured here if needed.

// --------------------------------------------------------------------------------
// Lighting Setup
// --------------------------------------------------------------------------------
// Ambient Light: Provides a basic level of illumination to the entire scene.
// Color: white (0xffffff), Intensity: 0.5 (moderate).
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional Light: Emits light from a specific direction, simulating a distant light source like the sun.
// Color: white (0xffffff), Intensity: 0.8.
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// Position the light source.
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Optional: Add a helper to visualize the DirectionalLight.
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5); // Size of the helper visual
scene.add(directionalLightHelper);

// Target for Directional Light: Defines the point the light is aimed at.
// The model is centered at (0,0,0), so the light targets this origin.
const directionalLightTarget = new THREE.Object3D();
directionalLightTarget.position.set(0, 0, 0);
scene.add(directionalLightTarget); // The target object must be part of the scene.
directionalLight.target = directionalLightTarget;

// SpotLight: Emits light from a point in a cone shape, used here to highlight the model.
// Color: white (0xffffff)
const spotLight = new THREE.SpotLight(0xffffff);
spotLight.intensity = 100; // Adjusted intensity
spotLight.distance = 5; // Adjusted maximum range of the light.
spotLight.angle = Math.PI / 36; // Cone angle in radians (5 degrees for a slightly wider focus).
spotLight.penumbra = 0.5; // Percent of the spotlight cone that is softened due to penumbra.
spotLight.decay = 2; // Amount the light dims along the distance of the cone.
// The SpotLight is configured and added as a child of the model after the model loads,
// allowing it to move with the model if the model were to be animated or repositioned.
// Intensity and angle are primary adjustments for visibility and focus.

// --------------------------------------------------------------------------------
// Model Setup & Loading
// --------------------------------------------------------------------------------
// Variable to store the loaded 3D model.
let model;

// Function to adjust the camera to properly frame the loaded model.
function adjustCameraForModel() {
    if (!model) return; // Exit if the model hasn't been loaded yet.

    // Create a bounding box around the model to get its dimensions.
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    // const center = new THREE.Vector3(); // Model is already centered at origin.
    // box.getCenter(center);

    // Avoid division by zero or issues if the model has no size.
    if (size.x === 0 && size.y === 0 && size.z === 0) return;

    // Determine the largest dimension of the model (width, height, or depth).
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calculate the distance needed for the camera to view the entire model.
    // This formula uses the camera's vertical FOV and the model's largest dimension.
    // It ensures the model fits within the camera's view frustum.
    const distance = (maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    // Position the camera along the positive Z-axis.
    // Add half of the model's depth (size.z / 2) to the calculated distance.
    // This ensures the camera is 'distance' away from the front face of the model's bounding box.
    camera.position.set(0, 0, distance + (size.z / 2));

    // Point the camera to look at the model's center (which is the world origin 0,0,0).
    camera.lookAt(0, 0, 0);

    // Update the camera's projection matrix after changing its parameters.
    // This is crucial for the changes to take effect.
    camera.updateProjectionMatrix();
}

// Initialize GLTF Loader for loading .glb or .gltf models.
const gltfLoader = new GLTFLoader();
// URL of the 3D model to be loaded.
const modelUrl = 'https://raw.githubusercontent.com/RSOS-ops/jules-test/main/HoodedCory_PlanarFace_BigWireframe.glb';

// Load the GLTF model.
gltfLoader.load(
    modelUrl, // Model URL
    (gltf) => { // Success callback
        model = gltf.scene; // Assign the loaded scene (model)
        scene.add(model);   // Add the model to the main scene

        // Center the model at the world origin (0,0,0).
        // This simplifies camera positioning and lighting setup.
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Configure and attach the SpotLight to the model.
        const spotLightTargetObject = new THREE.Object3D();
        model.add(spotLightTargetObject); // Add target as a child of the model.
        spotLightTargetObject.position.set(0, 0, 0); // Target is at the model's local origin.

        spotLight.target = spotLightTargetObject; // Aim the spotlight at this target.
        model.add(spotLight); // Add the spotlight itself as a child of the model.
        // Position the spotlight relative to the model's local coordinates.
        // Assuming +Z is forward from the model, this places the light in front of it.
        spotLight.position.set(0, 0, 10);

        // Optional: Add a helper to visualize the SpotLight.
        // This should be added to the main scene for visibility, not the model.
        const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        scene.add(spotLightHelper);

        // Adjust camera to fit the newly loaded model.
        adjustCameraForModel();
    },
    (xhr) => { // Progress callback
        // Log loading progress to the console.
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => { // Error callback
        // Log any errors that occur during model loading.
        console.error('An error occurred loading the GLB model:', error);
    }
);

// --------------------------------------------------------------------------------
// Animation Loop
// --------------------------------------------------------------------------------
// The `animate` function is called recursively to create a render loop.
function animate() {
    requestAnimationFrame(animate); // Request the next frame.

    // Update OrbitControls if damping is enabled.
    // This ensures smooth camera movements continue after user input stops.
    if (controls.enableDamping) {
        controls.update();
    }

    // Render the scene from the perspective of the camera.
    renderer.render(scene, camera);
}
// Start the animation loop.
animate();

// --------------------------------------------------------------------------------
// Event Listeners
// --------------------------------------------------------------------------------
// Handle window resize events to maintain correct aspect ratio and rendering size.
window.addEventListener('resize', () => {
    // Update camera's aspect ratio.
    camera.aspect = window.innerWidth / window.innerHeight;
    // Update renderer's size.
    renderer.setSize(window.innerWidth, window.innerHeight);

    // If the model is loaded, readjust the camera to fit it.
    if (model) {
        adjustCameraForModel(); // This function now includes camera.updateProjectionMatrix()
    } else {
        // If the model is not yet loaded, still update the projection matrix
        // as the aspect ratio might have changed.
        camera.updateProjectionMatrix();
    }
});

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Added this line

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
let controls; // Declare controls variable
controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Orbit around the center of the scene (where the model is)
controls.enableDamping = true;   // Enable damping (inertia)
controls.dampingFactor = 0.05;   // Damping factor
// controls.autoRotate = false; // Default is false, so not strictly needed
// controls.screenSpacePanning = false; // Default is true, keep it for now

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Explicitly set the target for the directional light
const directionalLightTarget = new THREE.Object3D();
directionalLightTarget.position.set(0, 0, 0); // Target the world origin
scene.add(directionalLightTarget); // Add target to the scene
directionalLight.target = directionalLightTarget;

// Add DirectionalLightHelper for debugging
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5); // Second arg is helper size
scene.add(directionalLightHelper);
console.log("DirectionalLightHelper added to the scene.");

// Spotlight for the model
const spotLight = new THREE.SpotLight(0xffffff, 5); // Intensity 5
spotLight.distance = 1; // Distance updated
spotLight.angle = Math.PI / 18; // Angle set to 10 degrees
spotLight.penumbra = 0.5; // Penumbra 0.5
spotLight.decay = 2; // Standard decay
// scene.add(spotLight); // Will be added as a child of the model later

// New Directional Light for the model

// Model
let model; // To store the loaded model

function adjustCameraForModel() {
    if (!model) return;

    // Get model's bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Determine the maximum dimension of the model
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim === 0) return; // Avoid division by zero if model is empty or size is zero

    // Calculate effective FOV - using vertical FOV for calculations with aspect ratio
    // const fov = THREE.MathUtils.degToRad(camera.fov);
    // let cameraZ = Math.abs(size.y / 2 / Math.tan(fov / 2)); // Fit height by default
    // if (camera.aspect < size.x / size.y) { // if width is the limiting factor
    //     cameraZ = Math.abs(size.x / camera.aspect / 2 / Math.tan(fov / 2));
    // }
    // camera.position.z = cameraZ * 1.1; // Add 10% buffer, want 90% coverage

    // Simpler approach: Fit the largest dimension (maxDim) into 90% of the view.
    // Consider the camera's actual FOV (vertical) and aspect ratio.
    // The distance 'd' from camera to plane where an object of height 'H' fits the view:
    // d = (H/2) / tan(fov/2)
    // For width 'W': d = (W/aspect / 2) / tan(fov/2)
    // We want maxDim to be 90% of the larger of the frustum width or height at model's distance.

    const targetCoverage = 0.90; // 90% of the screen

    // Calculate distance needed to fit the model's largest dimension (maxDim)
    // This considers fitting maxDim either to frustum height or frustum width
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    let distanceBasedOnHeight = (size.y / targetCoverage) / (2 * Math.tan(verticalFov / 2));
    let distanceBasedOnWidth = (size.x / targetCoverage) / (2 * Math.tan(verticalFov / 2) * camera.aspect);

    // We need to ensure the *entire* model fits.
    // If we base distance on model's height (size.y), its width (size.x) might be clipped or too small.
    // We need to find the distance 'd' such that:
    // Model_Visible_Height = 2 * d * tan(vFOV/2)
    // Model_Visible_Width = 2 * d * tan(vFOV/2) * aspect
    // We want size.y < targetCoverage * Model_Visible_Height AND size.x < targetCoverage * Model_Visible_Width

    // Let's use the logic from the previous text scaling:
    // Fit the model's bounding sphere radius, or use max dimension.
    const boundingSphere = new THREE.Sphere();
    box.getBoundingSphere(boundingSphere);
    const objectAngularSize = camera.fov * (Math.PI / 180); // FOV in radians

    // Heuristic: Use largest dimension (width or height) for fitting.
    // This is similar to the text logic.
    const dominantSize = Math.max(size.x, size.y); // Using X or Y for screen fitting
    const hFOV = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    // Required distance = (object size / 2) / tan(horizontal_fov / 2) for width fitting
    // Required distance = (object size / 2) / tan(vertical_fov / 2) for height fitting

    let requiredDistance;
    if (camera.aspect >= size.x / size.y) { // Screen is wider than model aspect ratio, fit by height
        requiredDistance = (size.y / targetCoverage / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    } else { // Screen is narrower than model aspect ratio, fit by width
        requiredDistance = (size.x / targetCoverage / 2) / Math.tan(hFOV / 2);
    }

    camera.position.z = requiredDistance + (size.z / 2); // Add half depth of model as buffer

    if (camera.position.z < camera.near) {
        camera.position.z = camera.near + (size.z / 2) + 1; // Move further if too close
    }

    camera.lookAt(0, 0, 0); // Model is at origin
    camera.updateProjectionMatrix();
}


// GLTF Loader
const gltfLoader = new GLTFLoader();
const modelUrl = 'https://raw.githubusercontent.com/RSOS-ops/jules-test/main/HoodedCory_PlanarFace_BigWireframe.glb';

gltfLoader.load(
    modelUrl,
    (gltf) => {
        console.log('GLB model loaded successfully.');
        model = gltf.scene;
        scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // Center the model at world origin

        console.log('Model added to scene and centered.');

        // Configure SpotLight
        const spotLightTarget = new THREE.Object3D();
        model.add(spotLightTarget); // Target is at model's local origin (0,0,0)
        spotLightTarget.position.set(0, 0, 0); // Explicitly set target position if needed

        spotLight.target = spotLightTarget;
        model.add(spotLight);
        spotLight.position.set(0, 0, 1); // Position updated

        console.log("SpotLight configured, parented to model, and positioned.");

        // Add Spotlight Helper for debugging
        const spotLightHelper = new THREE.SpotLightHelper(spotLight);
        scene.add(spotLightHelper);
        console.log("SpotLightHelper added to the scene.");

        adjustCameraForModel();
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error occurred loading the GLB model:', error);
    }
);

// Render loop
function animate() {
    requestAnimationFrame(animate);

    // Required if controls.enableDamping or controls.autoRotate are set to true
    if (controls.enableDamping) {
        controls.update();
    }

    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    // camera.updateProjectionMatrix(); // adjustCameraForModel will call this
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (model) { // Ensure model is loaded before trying to adjust
        adjustCameraForModel();
    }
});

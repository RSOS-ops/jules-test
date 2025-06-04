import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background

// Camera
//fov, aspect, near, far
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 50; // Initial Z, will be adjusted

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Added antialias for smoother text
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Text Object
let textMesh;
const textToDisplay = "Cory Richard";

function adjustCameraAndText() {
    if (!textMesh) return;

    // Ensure text bounding box is up-to-date if transformations were applied to geometry
    // For a mesh, the boundingBox is in local space. We need world space for camera calculations.
    // However, since our textMesh is at (0,0,0) and not rotated, local and world are similar for width.

    textMesh.geometry.computeBoundingBox(); // Ensure fresh bounding box from geometry
    const textBoundingBox = textMesh.geometry.boundingBox;
    const actualTextWidth = textBoundingBox.max.x - textBoundingBox.min.x;

    // Calculate the visible width at the text's current Z position (which is 0)
    // We want the text to take 80% of the screen width.
    // The camera is looking along the -Z axis. Text is at Z = 0.
    // visible_width = 2 * tan(fov/2) * distance_from_camera_to_object * aspect_ratio

    // We need to find the right camera.position.z
    // Let targetScreenWidthRatio = 0.8
    // targetTextScreenWidth = window.innerWidth * targetScreenWidthRatio
    // projectedTextWidth = (actualTextWidth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z)) * window.innerWidth / camera.aspect
    // This gets complicated quickly.
    // A simpler approach: Set text scale to 1 initially. Find Z where its current size is 80% of view.

    // Reset text scale to 1 to measure its "natural" size at a distance
    textMesh.scale.set(1, 1, 1);
    textMesh.geometry.computeBoundingBox(); // Recompute for safety, though it shouldn't change
    const naturalTextWidth = textMesh.geometry.boundingBox.max.x - textMesh.geometry.boundingBox.min.x;

    if (naturalTextWidth === 0) return; // Avoid division by zero if text width is 0

    // Calculate the Z distance for the camera such that the naturalTextWidth spans 80% of the view.
    // visibleWidth = 2 * Math.tan(fov/2) * Z
    // We want naturalTextWidth / (camera.aspect) to be 0.8 * visibleWidth (horizontal FOV is tricky)
    // Or, more directly for horizontal FOV:
    // visibleWidthAtZ = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov * camera.aspect / 2)); // This is an approximation
    // A more robust way for PerspectiveCamera:
    // The distance (depth) at which an object of 'actualTextWidth' fills 'targetFrustumWidthRatio' (0.8) of the view.
    // frustumWidth = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    // We want: actualTextWidth = 0.8 * frustumWidth
    // actualTextWidth = 0.8 * (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect)
    // So, camera.position.z = actualTextWidth / (0.8 * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect)

    const targetWidthRatio = 0.8;
    const hFOV = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    // Required distance = (object size / 2) / tan(horizontal_fov / 2)
    let requiredDistance = (naturalTextWidth / targetWidthRatio / 2) / Math.tan(hFOV / 2);

    // Add a small buffer, or use the text's depth if it's significant
    const textDepth = textMesh.geometry.boundingBox.max.z - textMesh.geometry.boundingBox.min.z;
    camera.position.z = requiredDistance + textDepth; // Place camera just beyond the text's "width-defined" position

    // Ensure the text is not clipped by the near plane
    if (camera.position.z < camera.near) {
        camera.position.z = camera.near + textDepth + 1; // Move further if too close
        console.warn("Text was too close to near plane, adjusted camera.position.z");
    }

    // No scaling needed for the text itself if we adjust camera position correctly.
    // Text remains at scale 1,1,1
    camera.lookAt(scene.position); // Ensure camera looks at the origin where text is centered
    camera.updateProjectionMatrix();
}


// Font Loading
const fontLoader = new FontLoader();
fontLoader.load(
    'https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json', // Placeholder
    (font) => {
        console.log('Font loaded successfully!');

        const textGeometry = new TextGeometry(
            textToDisplay,
            {
                font: font,
                size: 5, // This size is relative, actual screen size depends on camera
                depth: 0.5,
                curveSegments: 12,
                bevelEnabled: false, // Simpler text for now
                // bevelThickness: 0.2,
                // bevelSize: 0.1,
                // bevelSegments: 3
            }
        );

        textGeometry.computeBoundingBox();
        textGeometry.translate(
            -(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2,
            -(textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y) / 2,
            -(textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z) / 2
        );

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        textMesh = new THREE.Mesh(textGeometry, textMaterial);
        scene.add(textMesh);
        console.log('Text mesh added to scene.');

        adjustCameraAndText(); // Adjust camera once text is loaded and added
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error occurred loading the font:', error);
    }
);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    // camera.updateProjectionMatrix(); // adjustCameraAndText will call this
    renderer.setSize(window.innerWidth, window.innerHeight);
    adjustCameraAndText(); // Re-adjust on resize
});

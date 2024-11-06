import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from './getStarfield.js';

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);
new OrbitControls(camera, renderer.domElement);

const detail = 12;
const loader = new THREE.TextureLoader();
const geometry = new THREE.IcosahedronGeometry(1, detail);

const material = new THREE.MeshPhongMaterial({
    map: loader.load("/static/textures/00_earthmap1k.jpg"),
    specularMap: loader.load("/static/textures/02_earthspec1k.jpg"),
    bumpMap: loader.load("/static/textures/01_earthbump1k.jpg"),
    bumpScale: 0.04
});

const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
    map: loader.load("/static/textures/03_earthlights1k.jpg"),
    blending: THREE.AdditiveBlending
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load("/static/textures/04_earthcloudmap.jpg"),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    alphaMap: loader.load('/static/textures/05_earthcloudmaptrans.jpg')
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

const stars = getStarfield({ numStars: 2000 });
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

function handleWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

// Initialize Leaflet map
const map = L.map('map').setView([0, 0], 2);  // Set to (0,0) as default view
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

function onMouseClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earthMesh);

    if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        const latitude = THREE.MathUtils.radToDeg(Math.asin(intersectPoint.y));
        let longitude = THREE.MathUtils.radToDeg(Math.atan2(intersectPoint.z, intersectPoint.x));
        if (longitude < -180) longitude += 360;
        if (longitude > 180) longitude -= 360;

        // Update map view and add marker
        map.setView([latitude, longitude], 4);
        L.marker([latitude, longitude]).addTo(map);

        console.log(`Latitude: ${latitude.toFixed(5)}, Longitude: ${longitude.toFixed(5)}`);
    }
}

window.addEventListener('click', onMouseClick);

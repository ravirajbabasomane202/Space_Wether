import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from './getStarfield.js';
import { getFresnelMat } from './getFresnelMat.js';

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

const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMat);
glowMesh.scale.setScalar(1.01);
earthGroup.add(glowMesh);

const stars = getStarfield({ numStars: 2000 });
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

const markerGroup = new THREE.Group();
scene.add(markerGroup);

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

async function updateSliders() {
    try {
        const response = await fetch('/data');
        const data = await response.json();

        setSliderAndDisplay('param1', data['KP index']);
        setSliderAndDisplay('param2', data['Solar wind']);
        setSliderAndDisplay('param3', data['BZ']);
        setSliderAndDisplay('param4', data['Proton density']);
    } catch (error) {
        console.error('Error fetching parameter data:', error);
    }
}

function setSliderAndDisplay(param, value) {
    document.getElementById(`${param}-slider`).value = value;
    document.getElementById(`${param}-display`).innerText = `${param.replace('_', ' ')}: ${value}`;
}

function addMarker(latitude, longitude) {
    markerGroup.clear();

    const latRad = THREE.MathUtils.degToRad(latitude);
    const lonRad = THREE.MathUtils.degToRad(longitude);
    const radius = 1;
    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.sin(lonRad);

    const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(x, y, z);
    markerGroup.add(marker);
}

function onMouseClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earthMesh);

    if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        const latitude = THREE.MathUtils.radToDeg(Math.asin(intersectPoint.y / 1));
        const longitude = THREE.MathUtils.radToDeg(Math.atan2(intersectPoint.z, intersectPoint.x));

        updatePrediction(latitude, longitude);
    }
}

async function updatePrediction(latitude, longitude) {
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ latitude, longitude })
        });

        const result = await response.json();
        document.getElementById('result').innerText = 
            `KP Index: ${result.kp_index}, Solar Wind Speed: ${result.solar_wind_speed}, BZ: ${result.bz}, Proton Density: ${result.proton_density}`;
        
        const predictionEvent = new CustomEvent('predictionUpdate', { detail: { latitude, longitude } });
        document.dispatchEvent(predictionEvent);
    } catch (error) {
        console.error('Prediction update failed:', error);
    }
}

updateSliders();

document.addEventListener('predictionUpdate', (event) => {
    const { latitude, longitude } = event.detail;
    addMarker(latitude, longitude);
});

window.addEventListener('click', onMouseClick);

import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js";

function main() {
    const canvas = document.querySelector("#myCanvas");
    const renderer = new THREE.WebGLRenderer({ canvas });

    //set scene
    const fov = 70;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.y = 60;
    camera.position.z = 250;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera Orbit
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    //set lighting
    let lights = [];
    const directLight1 = new THREE.DirectionalLight(0xffffff, 1);
    const ambientLight = new THREE.AmbientLight(0x555555, 1);

    directLight1.position.set(0, 6, 0);
    directLight1.target.position.set(0, 0, 0);

    lights.push(directLight1);
    lights.push(ambientLight);

    lights.forEach((light) => {
        scene.add(light);
        light.visible = false;
    });

    lights[0].visible = true;
    lights[1].visible = true;

    //set objects
    const objects = [];

    function addObject(x, y, z, obj, spread) {
        obj.position.x = x * spread;
        obj.position.y = y * 15;
        obj.position.z = z * spread;

        scene.add(obj);
        objects.push(obj);
    }

    function addGeometry(x, y, z, spread, geometry, material) {
        const mesh = new THREE.Mesh(geometry, material);
        addObject(x, y, z, mesh, spread);
    }

    //make plane 1
    let plane;
    {
        const width = 180;
        const height = 5;
        const depth = 180;
        plane = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({
                color: "#5E454B",
                roughness: 0.55,
                metalness: 1,
                side: THREE.DoubleSide,
                emissive: 0x807d7d,
            })
        );
        addObject(0.5, -2.8, 0, plane, 15);
    }

    let xPos = 0;
    let yPos = 0;
    let zPos = 0;
    let count = 0;
    let timer = 1000;

    //make ball
    const objLeft = document.querySelector(".countNum");
    function makeBall() {
        const radius = 5.0;
        const detail = 5;
        addGeometry(
            xPos + Math.random() / 2 - 2.5,
            yPos - 2,
            zPos + Math.random() / 2 - 2.5,
            30,
            new THREE.DodecahedronGeometry(radius, detail),
            new THREE.MeshPhongMaterial({
                color: randomColor(),
                shininess: 150,
            })
        );
        xPos++;

        if (xPos % 6 == 0 && xPos != 0) {
            xPos = 0;
            zPos++;
        }

        count++;
        objLeft.innerHTML = count;
        if (count % 36 == 0 && count != 0) {
            xPos = 0;
            zPos = 0;
            yPos += 1.5;
        }
        if (count < 216) {
            timer = (timer / 10) * 9;
            setTimeout(makeBall, timer);
        }
    }
    makeBall();

    function randomColor() {
        const colors = [
            "#A155B9",
            "#8E0505",
            "#165BAA",
            "#FFF7E0",
            "#FFE699",
            "#FF9292",
            "#B2F9FC",
        ];
        const index = Math.floor(Math.random() * (7 - 0)) + 0;
        const hex = `${colors[index]}`;
        // console.log(hex);
        return hex;
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    //set raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const scoreBoard = document.querySelector(".score");

    let selectedPiece1,
        selectedPiece2,
        score = 0,
        countdown = count;

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    const correctSound = document.querySelector(".correct-sound");
    function resetMaterials() {
        for (let i = 0; i < scene.children.length; i++) {
            if (scene.children[i].material) {
                if (selectedPiece2 && selectedPiece1) {
                    if (
                        selectedPiece1.material.color.getHex() ===
                        selectedPiece2.material.color.getHex()
                    ) {
                        correctSound.play();
                        console.log(selectedPiece1.material.color.getHex());
                        console.log(selectedPiece2.material.color.getHex());

                        scene.remove(selectedPiece1);
                        scene.remove(selectedPiece2);
                        score++;
                        countdown -= 2;
                        scoreBoard.innerHTML = score;
                        objLeft.innerHTML = count;
                    }
                    selectedPiece1 = null;
                    selectedPiece2 = null;
                }

                if (
                    scene.children[i] == selectedPiece1 ||
                    scene.children[i] == selectedPiece2
                )
                    scene.children[i].material.opacity = 0.6;
                else {
                    scene.children[i].material.opacity = 1.0;
                }
            }
        }
    }

    function hoverPieces() {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, false);
        if (intersects.length > 0) {
            if (intersects[0].object !== plane) {
                intersects[0].object.material.transparent = true;
                intersects[0].object.material.opacity = 0.6;
            }
        }
    }

    const clickSound = document.querySelector(".click-sound");
    function onClick() {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
            clickSound.play();
            if (!selectedPiece1 && !selectedPiece2) {
                selectedPiece1 = intersects[0].object;
            } else if (
                selectedPiece1 &&
                !selectedPiece2 &&
                intersects[0].object != selectedPiece1
            ) {
                selectedPiece2 = intersects[0].object;
            } else if (selectedPiece1 && selectedPiece2) {
                selectedPiece1 = intersects[0].object;
                selectedPiece2 = null;
            }
        } else {
            selectedPiece1 = null;
            selectedPiece2 = null;
        }
    }

    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("click", onClick);

    // function
    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        resetMaterials();
        hoverPieces();

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();

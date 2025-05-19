import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
scene.backgroundColor = 0x000000;

const stats = new Stats();
document.body.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const orthographicCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -500, 500);
const p_orbitControls = new OrbitControls(perspectiveCamera, renderer.domElement);
const o_orbitControls = new OrbitControls(orthographicCamera, renderer.domElement);

window.addEventListener('resize', onResize, false);
function onResize() {
	let aspect = window.innerWidth / window.innerHeight;
    perspectiveCamera.aspect = aspect;
    orthographicCamera.left = orthographicCamera.bottom * aspect;
    orthographicCamera.right = orthographicCamera.top * aspect;
    perspectiveCamera.updateProjectionMatrix();
    orthographicCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

perspectiveCamera.position.set(0, 40, 80);
orthographicCamera.position.set(0, 40, 80);
p_orbitControls.enableDamping = true;
o_orbitControls.enableDamping = true;
scene.add(perspectiveCamera);
scene.add(orthographicCamera);


const textureLoader = new THREE.TextureLoader();
const clock = new THREE.Clock(false);
const gui = new GUI();

// add ambient light
const ambientLight = new THREE.AmbientLight(0x606060);
scene.add(ambientLight);
// add point light
const pointLight = new THREE.PointLight(0xffffff, 10000, 0, 2);
pointLight.position.set(0, 0, 0);
pointLight.castShadow = true;
scene.add(pointLight);

const ROTATION_CONST = 100;
const ORBIT_CONST = 30;


const camera_control = {
	dir : null,
	fov : 0,
	sun_size : 0,
	gui : null,
	'Switch Camera Type' : function() {
		if(this['Current Camera'] == 'Perspective') {
			this.dir = new THREE.Vector3(
				perspectiveCamera.position.x,
				perspectiveCamera.position.y,
				perspectiveCamera.position.z
			);
			this.sun_size = Math.asin(10 / this.dir.length()) * 360 / (Math.PI * 75);
			this.dir.normalize();
			this.fov = -75;
		}
		else {
			this['Current Camera'] = 'Perspective';
			this.dir = new THREE.Vector3(
				orthographicCamera.position.x,
				orthographicCamera.position.y,
				orthographicCamera.position.z
			).normalize();
			this.sun_size = 10 * orthographicCamera.zoom / orthographicCamera.top;
			this.fov = 0;
		}
	},
	'Current Camera' : 'Perspective',
	initialize : function() {
		this.fov = 75;
		this['Current Camera'] = 'Perspective';
		this.gui = gui.addFolder('Camera');
		this.gui.add(this, 'Switch Camera Type');
		this.gui.add(this, 'Current Camera').listen();
	},
	update : function(t) {
		if(this['Current Camera'] == 'Perspective' && this.fov < 75) {
			this.fov += 7.5;
			if(this.fov == 0) {
				this['Current Camera'] = 'Orthographic';
				orthographicCamera.position.set(this.dir.x, this.dir.y, this.dir.z);
				orthographicCamera.zoom = 1;
				orthographicCamera.top = 10 / this.sun_size;
				orthographicCamera.bottom = -10 / this.sun_size;
				onResize();
			}
			else {
				let fov = (this.fov < 0) ? -this.fov : this.fov;
				let r = 10 / Math.sin(this.sun_size * Math.PI * fov / 360);
				perspectiveCamera.fov = fov;
				perspectiveCamera.position.set(this.dir.x * r, this.dir.y * r, this.dir.z * r);
				perspectiveCamera.updateProjectionMatrix();
			}
		}
	}
};

const sun = {
	geo : new THREE.SphereGeometry(10),
	mat : new THREE.MeshBasicMaterial({
		color : 0xffdd00,
	}),
	mesh : null,
	gui : null,
	initialize : function() {
		this.mesh = new THREE.Mesh(this.geo, this.mat);
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = false;
		this.mesh.receiveShadow = false;
		scene.add(this.mesh);
	},
	update : function(t) {}
};

const mercury = {
	geo : new THREE.SphereGeometry(1.5),
	mat : new THREE.MeshStandardMaterial({
		color : 0xa6a6a6,
		map : textureLoader.load('Mercury.jpg'),
		roughness : 0.8,
		metalness : 0.2,
	}),
	mesh : null,
	gui : null,
	pivot : null,
	'Rotation Speed'	: 0.02,
	'Orbit Speed'		: 0.02,
	initialize : function() {
		this.mesh = new THREE.Mesh(this.geo, this.mat);
		this.mesh.position.set(20, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		scene.add(this.mesh);

		this.pivot = new THREE.Object3D();
		this.pivot.add(this.mesh);
		scene.add(this.pivot);

		this.gui = gui.addFolder('Mercury');
		this.gui.add(this, 'Rotation Speed', 0, 0.1, 0.001);
		this.gui.add(this, 'Orbit Speed', 0, 0.1, 0.001);
	},
	update : function(t) {
		this.mesh.rotation.y += this['Rotation Speed'] * t * ROTATION_CONST;
		this.pivot.rotation.y += this['Orbit Speed'] * t * ORBIT_CONST;
	}
};

const venus = {
	geo : new THREE.SphereGeometry(3),
	mat : new THREE.MeshStandardMaterial({
		color : 0xe39e1c,
		map : textureLoader.load('Venus.jpg'),
		roughness : 0.8,
		metalness : 0.2,
	}),
	mesh : null,
	pivot : null,
	gui : null,
	'Rotation Speed'	: 0.015,
	'Orbit Speed'		: 0.015,
	initialize : function() {
		this.mesh = new THREE.Mesh(this.geo, this.mat);
		this.mesh.position.set(35, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		scene.add(this.mesh);

		this.pivot = new THREE.Object3D();
		this.pivot.add(this.mesh);
		scene.add(this.pivot);

		this.gui = gui.addFolder('Venus');
		this.gui.add(this, 'Rotation Speed', 0, 0.1, 0.001);
		this.gui.add(this, 'Orbit Speed', 0, 0.1, 0.001);
	},
	update : function(t) {
		this.mesh.rotation.y += this['Rotation Speed'] * t * ROTATION_CONST;
		this.pivot.rotation.y += this['Orbit Speed'] * t * ORBIT_CONST;
	}
};

const earth = {
	geo : new THREE.SphereGeometry(3.5),
	mat : new THREE.MeshStandardMaterial({
		color : 0x3498db,
		map : textureLoader.load('Earth.jpg'),
		roughness : 0.8,
		metalness : 0.2,
	}),
	mesh : null,
	pivot : null,
	gui : null,
	'Rotation Speed'	: 0.01,
	'Orbit Speed'		: 0.01,
	initialize : function() {
		this.mesh = new THREE.Mesh(this.geo, this.mat);
		this.mesh.position.set(50, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		scene.add(this.mesh);

		this.pivot = new THREE.Object3D();
		this.pivot.add(this.mesh);
		scene.add(this.pivot);

		this.gui = gui.addFolder('Earth');
		this.gui.add(this, 'Rotation Speed', 0, 0.1, 0.001);
		this.gui.add(this, 'Orbit Speed', 0, 0.1, 0.001);
	},
	update : function(t) {
		this.mesh.rotation.y += this['Rotation Speed'] * t * ROTATION_CONST;
		this.pivot.rotation.y += this['Orbit Speed'] * t * ORBIT_CONST;
	}
};

const mars = {
	geo : new THREE.SphereGeometry(2.5),
	mat : new THREE.MeshStandardMaterial({
		color : 0xc0392b,
		map : textureLoader.load('Mars.jpg'),
		roughness : 0.8,
		metalness : 0.2,
	}),
	mesh : null,
	pivot : null,
	gui : null,
	'Rotation Speed'	: 0.008,
	'Orbit Speed'		: 0.008,
	initialize : function() {
		this.mesh = new THREE.Mesh(this.geo, this.mat);
		this.mesh.position.set(65, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		scene.add(this.mesh);

		this.pivot = new THREE.Object3D();
		this.pivot.add(this.mesh);
		scene.add(this.pivot);

		this.gui = gui.addFolder('Mars');
		this.gui.add(this, 'Rotation Speed', 0, 0.1, 0.001);
		this.gui.add(this, 'Orbit Speed', 0, 0.1, 0.001);
	},
	update : function(t) {
		this.mesh.rotation.y += this['Rotation Speed'] * t * ROTATION_CONST;
		this.pivot.rotation.y += this['Orbit Speed'] * t * ORBIT_CONST;
	}
};

const orbits = {
	geo : [
		new THREE.RingGeometry(19.9, 20.1, 80),
		new THREE.RingGeometry(34.9, 35.1, 140),
		new THREE.RingGeometry(49.9, 50.1, 200),
		new THREE.RingGeometry(64.9, 65.1, 260)
	],
	mat : new THREE.MeshBasicMaterial({
		color : 0x808080,
		side : THREE.DoubleSide
	}),
	mesh : [],
	initialize : function() {
		for(let i=0; i<4; i++) {
			let msh = new THREE.Mesh(this.geo[i], this.mat);
			msh.rotation.x = Math.PI / 2;
			this.mesh.push(msh);
			scene.add(msh);
		}
	},
	update : function(t) {}

};

const objects = [camera_control, sun, mercury, venus, earth, mars, orbits];
objects.forEach(function(obj) { obj.initialize(); });

function render() {
    stats.update();
    p_orbitControls.update();
	o_orbitControls.update();

	let t = clock.getDelta();
	objects.forEach(function(obj) { obj.update(t); });

	if(camera_control['Current Camera'] == 'Perspective') { renderer.render(scene, perspectiveCamera); }
	else { renderer.render(scene, orthographicCamera); }
    requestAnimationFrame(render);
}
clock.start();
render();







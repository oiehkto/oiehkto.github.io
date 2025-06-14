import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
/*** Global ***/
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias : true });
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const textureLoader = new THREE.TextureLoader();
const clock = new THREE.Clock(false);
const raycaster = new THREE.Raycaster();
const mousePointer = new THREE.Vector2();
const inputs = {
	'w' : false,
	'a' : false,
	's' : false,
	'd' : false
};

/*** Add objects ***/

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
// Point light
const pointLight = new THREE.PointLight(0xffffff, 10000, 0, 2);
pointLight.position.set(0, 0, 0);
pointLight.castShadow = true;
scene.add(pointLight);
// Spot light
const spotLight = new THREE.SpotLight();
spotLight.intensity = 10;
spotLight.decay = 0;
spotLight.position.set(0, 20, 0);
spotLight.penumbra = 0.5;
scene.add(spotLight);

// Background
const backgroundGeo = new THREE.SphereGeometry(160);
const backgroundMat = new THREE.MeshBasicMaterial({color : 0x000000, side : THREE.BackSide});
const background = new THREE.Mesh(backgroundGeo, backgroundMat);
background.userData = -1;
scene.add(background);

// Stars
const starDistance = 200;
const count = 1000;
const celestial = new THREE.Group();
const starGeo = new THREE.SphereGeometry(starDistance / 1000);
const starMat = new THREE.MeshStandardMaterial({color : 0xffffff, emissive : 0xffffff});
const starSelectionGeo = new THREE.SphereGeometry(starDistance / 50);
const starSelectionMat = new THREE.MeshBasicMaterial({color : 0xffffff, transparent : true, opacity : 0.5, visible : false});
for(let i=0; i<count; i++) {
	const starMesh = new THREE.Mesh(starGeo, starMat);
	const star = new THREE.Mesh(starSelectionGeo, starSelectionMat.clone());
	star.add(starMesh);
	star.position.randomDirection().setLength(starDistance);
	star.userData = i;
	celestial.add(star);
}
celestial.position.set(0, -120, 0);
scene.add(celestial);

// Constellation
const constellation = new THREE.Group();
constellation.position.copy(celestial.position);
scene.add(constellation);

// Surface
const size = 200.0;
const segments = 200;
const surfaceGeometry = new THREE.PlaneGeometry(size, size, segments, segments);
const surfaceMaterial = new THREE.MeshStandardMaterial({
	color : 0x5050ff,
	side : THREE.DoubleSide,
	metalness : 0.98,
	roughness : 0.0,
	transparent : true,
	opacity : 0.7
});
const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
surface.rotation.x = -Math.PI / 2;
surface.position.y = -5;
surface.receiveShadow = true;
scene.add( surface );
const z_vel = new Float32Array((segments + 1) ** 2); // velocity for points of plane

// Boat
const boatGeometry = new THREE.CapsuleGeometry(1, 1);
const boatMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff} ); 
const boatMesh = new THREE.Mesh( boatGeometry, boatMaterial );
boatMesh.rotation.x = -Math.PI/2;

const boat = new THREE.Group();
boat.add(boatMesh);
scene.add( boat );



const timer = {time : 0.0, period : 0.1, update : function(t) {
	this.time += t;
	if(this.time > this.period) {
		this.time -= this.period;
		return true;
	} else {
		return false;
	} }
};

const boat_stabilizer = {
	history : new Float32Array(5),
	newest : 0,
	push : function(value) {
		this.history[this.newest] = value / this.history.length;
		this.newest = (this.newest + 1) % this.history.length;
		let sum = 0;
		this.history.forEach((v) => {sum += v});
		return sum;
	}
};

function updateSurface(t) {
	function indexOf(i,j) {return i+j*(segments + 1);}
	// Constants setting
	const cutoff = 10;	// maximum elevation
	const speed = 8 * segments / size; // wave speed
	// Prepare attribute buffers
	surfaceGeometry.dispose();
	const attr = surfaceGeometry.getAttribute('position');
	const new_z = new Float32Array((segments + 1) ** 2);
	const new_v = new Float32Array((segments + 1) ** 2);
	// Keep surface to be placed at center
	const di = -Math.round(surface.position.x*segments/size);
	const dj = -Math.round(surface.position.z*segments/size);
	surface.position.x += di;
	surface.position.z += dj;
	// Fill buffers
	for(let i=0; i<=segments; i++){
	for(let j=0; j<=segments; j++){
		if(0 <= i+di && i+di <= segments && 0 <= j+dj && j+dj <= segments) {
			new_z[indexOf(i,j)] = attr.getZ(indexOf(i+di,j+dj));
			new_v[indexOf(i,j)] = z_vel[indexOf(i+di, j+dj)];
		}
	}}
	// Apply wave equation
	for(let i=0; i<=segments; i++) {
	for(let j=0; j<=segments; j++) {
		new_v[indexOf(i,j)] += (
			(i > 0        ? new_z[indexOf(i-1,j)] : 0) +
			(i < segments ? new_z[indexOf(i+1,j)] : 0) +
			(j > 0        ? new_z[indexOf(i,j-1)] : 0) +
			(j < segments ? new_z[indexOf(i,j+1)] : 0) +
			new_z[indexOf(i,j)] * -4) * speed * speed * t * t;
	}}
	// make random impulse
	if(timer.update(t)) {
		const k = 2.5;
		const i = Math.floor(Math.random() * (segments-1)) + 1; // 1 ~ segments-1
		const j = Math.floor(Math.random() * (segments-1)) + 1;
		if( (i-segments/2)**2 + (j-segments/2)**2 > (segments/8)**2 ){
			new_v[indexOf(i,j)] -= 4*k;
			new_v[indexOf(i-1,j)] += k;
			new_v[indexOf(i+1,j)] += k;
			new_v[indexOf(i,j-1)] += k;
			new_v[indexOf(i,j+1)] += k;
		}
	}
	// boat effect
	const boat_i = Math.round(((boat.position.x - surface.position.x) / size + 0.5) * segments);
	const boat_j = Math.round(((boat.position.z - surface.position.z) / size + 0.5) * segments);
	new_v[indexOf(boat_i, boat_j)] -= 2 * t;
	new_v[indexOf(boat_i-1, boat_j)] += 0.5 * t;
	new_v[indexOf(boat_i+1, boat_j)] += 0.5 * t;
	new_v[indexOf(boat_i, boat_j-1)] += 0.5 * t;
	new_v[indexOf(boat_i, boat_j+1)] += 0.5 * t;

	// update positions
	for(let i=0; i<=segments; i++) {
	for(let j=0; j<=segments; j++) {
		new_v[indexOf(i,j)] *= 0.99;
		new_z[indexOf(i,j)] += new_v[indexOf(i,j)];
		new_z[indexOf(i,j)] = Math.max(-cutoff, Math.min(cutoff, new_z[indexOf(i,j)]));
		attr.setZ(indexOf(i,j), new_z[indexOf(i,j)]);
	}}
	const boat_y = (
		new_z[indexOf(boat_i-2, boat_j)] +
		new_z[indexOf(boat_i+2, boat_j)] +
		new_z[indexOf(boat_i, boat_j-2)] +
		new_z[indexOf(boat_i, boat_j+2)]) / 4 + surface.position.y;
	boat.position.y = boat_stabilizer.push(boat_y);
	// update attributes of plane
	z_vel.set(new_v);
	surfaceGeometry.setAttribute('position', attr);
	surfaceGeometry.computeVertexNormals(); // this is heavy
}

const cameraController = {
	isOrbitControlOn : true,
	orbitControls : new OrbitControls(camera, renderer.domElement),
	time : 0,
	fov : 0,
	position : new THREE.Vector3(),
	target : new THREE.Vector3(),
	action : null,
	disposeOrbitControls : function() {
		this.isOrbitControlOn = false;
		if(this.orbitControls) {
			this.orbitControls.dispose();
		}
		this.orbitControls = null;
	},
	resetOrbitControls : function() {
		if(this.orbitControls) {
			this.orbitControls.dispose();
		}
		this.isOrbitControlOn = true;
		this.orbitControls = new OrbitControls(camera, renderer.domElement);
		this.orbitControls.maxDistance = size * 0.45;
		this.orbitControls.enablePan = false;
		this.orbitControls.enableDamping = true;
	},
	switchMode : function(time, fov, position, target, action=null) {
		this.disposeOrbitControls();
		this.time = time;
		this.fov = fov;
		this.position.copy(position);
		this.target.copy(target);
		this.action = action;
	},
	update : function(t) {
		if(this.isOrbitControlOn) {
			this.orbitControls.update();
		}
		else if(this.time == 0) {
			// camera is fixed
		}
		else {
			if(t < this.time) {
				const a = 1 - (1 - t / this.time)**5;

				const newPos = new THREE.Vector3().addVectors(
					camera.position.clone().multiplyScalar(1 - a),
					this.position.clone().multiplyScalar(a)
				);
				newPos.setLength(camera.position.length() * (1- a) + this.position.length() * (a));
				const oldDir = camera.getWorldDirection(new THREE.Vector3()).setLength(1 - a);
				const newDir = new THREE.Vector3().subVectors(this.target, newPos).setLength(a);

				camera.fov = camera.fov * (1 - a) + this.fov * (a);
				camera.position.copy(newPos);
				camera.lookAt(newDir.add(oldDir).add(newPos));
				camera.updateProjectionMatrix();
				
				this.time -= t;
			}
			else {
				this.time = 0;
				camera.fov = this.fov;
				camera.position.copy(this.position);
				camera.lookAt(this.target);
				this.resetOrbitControls();
				if(this.action) {
					this.action();
				}
			}
		}
	}
};

const starSelectionManager = {
	selectingMode : false,
	selectedStars : [],
	selectedEdges : [],
	onpointerdown : function() {
		if(this.selectedStars.length == 1) {
			this.selectingMode = true;
			cameraController.disposeOrbitControls();
		}
	},
	onpointerup : function() {
		this.selectingMode = false;
		if(!cameraController.isOrbitControlOn) {
			cameraController.resetOrbitControls();
		}
		this.unselect();
	},
	unselect : function() {
		if(!this.selectingMode) {
			this.selectedStars.forEach((star) => {
				star.material.color = new THREE.Color(0xffffff);
				star.material.visible = false;
			});
			this.selectedStars = [];
		}
	},
	select : function(star) {
		this.unselect();
		star.material.visible = true;
		if(this.selectedStars.length == 0) {
			this.selectedStars.push(star);
		}
		else {
			const a = this.selectedStars[this.selectedStars.length-1].userData;
			const b = star.userData;
			if(a != b) {
				this.selectedStars[this.selectedStars.length-1].material.color = new THREE.Color(0xffffff);
				star.material.color = new THREE.Color(0xffff50);
				this.selectedStars.push(star);
				for(let i=0; i<this.selectedEdges.length; i++) {
					if(this.selectedEdges[i].userData.id1 == Math.min(a,b) &&
					this.selectedEdges[i].userData.id2 == Math.max(a,b)) { return; }
				}
				if(a < b) {this.createEdge(this.selectedStars[this.selectedStars.length-2], star);}
				else {this.createEdge(star, this.selectedStars[this.selectedStars.length-2]);}
			}

		}
	},
	createEdge : function(star1, star2) { // id: star1 < star2
		const v1 = celestial.worldToLocal(star1.getWorldPosition(new THREE.Vector3()));
		const v2 = celestial.worldToLocal(star2.getWorldPosition(new THREE.Vector3()));
		const theta = v1.angleTo(v2);
		const curve = new THREE.EllipseCurve(0, 0, starDistance, starDistance, (Math.PI-theta)/2, (Math.PI+theta)/2);

		const u1 = new THREE.Vector3().subVectors(v2, v1).normalize();
		const u3 = new THREE.Vector3().crossVectors(v2, v1).normalize();
		const u2 = new THREE.Vector3().crossVectors(u3, u1);
		const rotMat3 = new THREE.Matrix3(
			u1.x, u2.x, u3.x,
			u1.y, u2.y, u3.y,
			u1.z, u2.z, u3.z);

		const curvePoints3 = [];
		curve.getPoints(10).forEach((vec2) => {
			curvePoints3.push(new THREE.Vector3(vec2.x, vec2.y, 0).applyMatrix3(rotMat3));
		});

		const edge = new THREE.Line(
			new THREE.BufferGeometry().setFromPoints(curvePoints3),
			new THREE.LineBasicMaterial({ color : 0xffffff })
		);
		edge.userData = { id1 : star1.userData, id2 : star2.userData };
		constellation.add(edge);
		this.selectedEdges.push(edge);
	}
};


function render() {
	let t = clock.getDelta();
	cameraController.update(t);

	// speed setting
	const boatSpeed = 15;
	const boatRotSpeed = 2;
	const stelRotSpeed = 0.05;
	// Compute direction of boat
	const dir = boat.getWorldDirection(new THREE.Vector3());
	const axis = new THREE.Vector3(-dir.z, 0, dir.x);
	let rotAngle = 0;
	dir.setLength(boatSpeed * t);
	// Update boat(y-rotation), surface(translation), stars(rotation), constellations(rotation)
	if(inputs['w']) { surface.position.add(dir); rotAngle -= stelRotSpeed * t;}
	if(inputs['a']) { boat.rotation.y += boatRotSpeed * t; }
	if(inputs['s']) { surface.position.sub(dir); rotAngle += stelRotSpeed * t;}
	if(inputs['d']) { boat.rotation.y -= boatRotSpeed * t; }
	celestial.rotateOnWorldAxis( axis, rotAngle );
	constellation.rotateOnWorldAxis( axis, rotAngle );
	// Update surface geometry
	updateSurface(t);


	// select stars
	raycaster.setFromCamera( mousePointer, camera );
	const intersections = raycaster.intersectObjects([background, ...celestial.children], false);
	if(intersections.length == 0) {
		// camera is not in the background sphere
		starSelectionManager.unselect();
	}
	else if(intersections[0].object.userData == -1) {
		// no stars selected
		starSelectionManager.unselect();
	}
	else {
		// star selected
		const star = intersections[0].object;
		starSelectionManager.select(star);
	}

	// set background color
	raycaster.set( camera.position, new THREE.Vector3(0, -1, 0) );
	if(raycaster.intersectObject(surface).length == 0) {
		background.material.color = new THREE.Color(0x101050);
	}
	else {
		background.material.color = new THREE.Color(0x000010);
	}
	renderer.render(scene, camera);
	// stop the loop if paused
	if(clock.running) {
		requestAnimationFrame(render);
	}
}

function initialize() {
	// renderer
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000);
	document.body.appendChild(renderer.domElement);
	//camera
	camera.position.set(0, 0, 35); // 0, 40, 80
	scene.add(camera);

  /*** Add event listeners ***/
	// window
	window.onresize = () =>
	{
	    camera.aspect = window.innerWidth / window.innerHeight;
	    camera.updateProjectionMatrix();
	    renderer.setSize(window.innerWidth, window.innerHeight);
	}
	window.onblur = () =>
	{
		console.log('blur');
		clock.stop();
	}
	window.onfocus = () =>
	{
		console.log('focus');
		clock.start();
		requestAnimationFrame(render);
	}
	// mouse
	window.onpointerdown = () =>
	{
		starSelectionManager.onpointerdown();
	}
	window.onpointerup = () =>
	{
		starSelectionManager.onpointerup();
	}
	window.onpointermove = (e) =>
	{
		mousePointer.x = 2 * e.clientX / window.innerWidth - 1;
		mousePointer.y = 1 - 2 * e.clientY / window.innerHeight;
	}
	// keyboard
	window.onkeydown = (e) =>
	{
		const key = e.key.toLowerCase();
	    if (key in inputs) {
			inputs[key] = true;
		}
	    if (key == 'r') {
			cameraController.switchMode(
				0.5,
				120,
				new THREE.Vector3(0, -4, 5),
				new THREE.Vector3(),
				function() {
					cameraController.orbitControls.enableZoom = false;
				}
			);
		}
	    if (key == 'q') {
			cameraController.switchMode(
				0.5,
				60,
				new THREE.Vector3(0, 0, 25),
				new THREE.Vector3(),
				null
			);
		}
	}
	window.onkeyup = (e) =>
	{
	    const key = e.key.toLowerCase();
	    if (key in inputs) {
			inputs[key] = false;
		}
	}
}
initialize();
clock.start();
render();







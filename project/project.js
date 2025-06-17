import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { starData } from './starData.js';
import { patternData } from './patternData.js';
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
	'd' : false,
	'tab' : false
};

const scene_ui = new THREE.Scene();
const camera_ui = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 1, 1000);

let uiMode = 'init';
const numberImages = [];
for(let i=0; i<10; i++) {
	numberImages.push(textureLoader.load('textures/number_'+i+'.png'));
}
numberImages.push(textureLoader.load('textures/number_s.png'));
const constellationImages = [];
const constellationImages_simple = [];
for(let i=1; i<=88; i++) {
	constellationImages.push(textureLoader.load('textures/constellation_patterns/0'+i+'.png'));
	constellationImages_simple.push(textureLoader.load('textures/constellation_patterns/'+i+'.png'));
}
const ui_0 = new THREE.Sprite(new THREE.SpriteMaterial({ map : textureLoader.load('textures/title.png') }));
const ui_1 = new THREE.Sprite(new THREE.SpriteMaterial({ map : textureLoader.load('textures/click_to_start.png') }));
const ui_2 = new THREE.Sprite(new THREE.SpriteMaterial({ map : numberImages[0] }));
const ui_3 = new THREE.Sprite(new THREE.SpriteMaterial({ map : numberImages[0] }));
const ui_4 = new THREE.Sprite(new THREE.SpriteMaterial({ map : numberImages[10] }));
const ui_5 = new THREE.Sprite(new THREE.SpriteMaterial({ map : numberImages[8] }));
const ui_6 = new THREE.Sprite(new THREE.SpriteMaterial({ map : numberImages[8] }));
const ui_7 = new THREE.Sprite(new THREE.SpriteMaterial({ map : constellationImages[0] }));
const ui_8 = new THREE.Sprite(new THREE.SpriteMaterial({ map : textureLoader.load('textures/guide.png') }));
scene_ui.add(ui_0);
scene_ui.add(ui_1);
scene_ui.add(ui_2);
scene_ui.add(ui_3);
scene_ui.add(ui_4);
scene_ui.add(ui_5);
scene_ui.add(ui_6);
scene_ui.add(ui_7);
scene_ui.add(ui_8);
ui_2.visible = false;
ui_3.visible = false;
ui_4.visible = false;
ui_5.visible = false;
ui_6.visible = false;
ui_7.visible = false;
ui_8.visible = false;

function ui_update() {
	// change number of found constellations, current constellation image
	let n_found = 0;
	constellation_found.forEach((found) => {
		if(found) {n_found++;}
	});
	ui_3.visible = true;
	ui_4.visible = true;
	ui_5.visible = true;
	ui_6.visible = true;
	const dec = Math.floor(n_found / 10);
	if(dec == 0) {
		ui_2.visible = false;
	}
	else {
		ui_2.visible = true;
		ui_2.material.map = numberImages[dec];
	}
	ui_3.material.map = numberImages[n_found % 10];
}

function onresize_ui() {
	ui_0.center = new THREE.Vector2(0, 0);
	ui_0.scale.set(window.innerWidth * 0.4, window.innerWidth * 0.08, 1);
	ui_0.position.set(window.innerWidth * 0.4, 0, 0);

	ui_1.center = new THREE.Vector2(0.5, 0.5);
	ui_1.scale.set(window.innerWidth * 0.09, window.innerWidth * 0.018, 1);
	ui_1.position.set(0, -window.innerHeight * 0.4, 0);

	ui_2.scale.set(window.innerWidth * 0.01, window.innerWidth * 0.02, 1);
	ui_3.scale.set(window.innerWidth * 0.01, window.innerWidth * 0.02, 1);
	ui_4.scale.set(window.innerWidth * 0.01, window.innerWidth * 0.02, 1);
	ui_5.scale.set(window.innerWidth * 0.01, window.innerWidth * 0.02, 1);
	ui_6.scale.set(window.innerWidth * 0.01, window.innerWidth * 0.02, 1);

	ui_2.position.set(window.innerWidth * 0.02, -window.innerHeight * 0.4, 0);
	ui_3.position.set(window.innerWidth * 0.01, -window.innerHeight * 0.4, 0);
	ui_4.position.set(0, -window.innerHeight * 0.4, 0);
	ui_5.position.set(-window.innerWidth * 0.01, -window.innerHeight * 0.4, 0);
	ui_6.position.set(-window.innerWidth * 0.02, -window.innerHeight * 0.4, 0);

	const sc = Math.min(window.innerWidth / 4, window.innerHeight / 3);
	ui_7.center = new THREE.Vector2(0, 0);
	ui_7.scale.set(sc, sc, 1);
	ui_7.position.set(window.innerWidth / 2, -window.innerHeight / 2, 0);

	ui_8.scale.set(window.innerWidth * 0.47, window.innerWidth * 0.25, 1);
}

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
background.userData = { id : 0 };
scene.add(background);

// Stars
const starDistance = 200;
const celestial = new THREE.Group(); // for stars
const constellation = new THREE.Group(); // for pattern
const starGeo = new THREE.SphereGeometry(starDistance / 1000);
const starMat = new THREE.MeshStandardMaterial({color : 0xffffff, emissive : 0xffffff});
const starSelectionGeo = new THREE.SphereGeometry(starDistance / 50);
const starSelectionMat = new THREE.MeshBasicMaterial({color : 0xffffff, transparent : true, opacity : 0.5, visible : false});

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
const z_velocity = new Float32Array((segments + 1) ** 2); // velocity for points of plane

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
	const normal = surfaceGeometry.getAttribute('normal');
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
			new_v[indexOf(i,j)] = z_velocity[indexOf(i+di, j+dj)];
		}
	}}
	// Apply wave equation
	for(let i=0; i<=segments; i++) {
	for(let j=0; j<=segments; j++) {
		const x_minus = i > 0        ? new_z[indexOf(i-1,j)] : 0;
		const x_plus  = i < segments ? new_z[indexOf(i+1,j)] : 0;
		const z_minus = j > 0        ? new_z[indexOf(i,j-1)] : 0;
		const z_plus  = j < segments ? new_z[indexOf(i,j+1)] : 0;
		const center  = new_z[indexOf(i,j)];
		new_v[indexOf(i,j)] += (x_minus + x_plus + z_minus + z_plus - 4*center) * speed * speed * t * t;
		// calculate approximated normal
		// This normal is not accurate but easy to compute
		// surfaceGeometry.computeVertexNormals() is too heavy
		normal.setX(indexOf(i,j), (x_minus - x_plus) * segments / (2 * size));
		normal.setY(indexOf(i,j), (z_minus - z_plus) * segments / (2 * size));
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
	z_velocity.set(new_v);
	surfaceGeometry.setAttribute('position', attr);
	surfaceGeometry.setAttribute('normal', normal);
}

const fadeoutEffect = [];

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
			findPatterns(this.selectedEdges);
			this.selectedEdges = [];
		}
	},
	select : function(star) {
		this.unselect();
		star.material.visible = true;
		if(this.selectedStars.length == 0) {
			this.selectedStars.push(star);
		}
		else {
			const a = this.selectedStars[this.selectedStars.length-1].userData.id;
			const b = star.userData.id;
			if(a != b) {
				this.selectedStars[this.selectedStars.length-1].material.color = new THREE.Color(0xffffff);
				star.material.color = new THREE.Color(0xffff50);
				this.selectedStars.push(star);
				for(let i=0; i<this.selectedEdges.length; i++) {
					if(this.selectedEdges[i].userData.id1 == Math.min(a,b) &&
					this.selectedEdges[i].userData.id2 == Math.max(a,b)) { return; }
				}
				if(a < b) {
					this.selectedEdges.push(createPatternEdge(
						this.selectedStars[this.selectedStars.length-2], star, 0xa0a050
					));
				}
				else {
					this.selectedEdges.push(createPatternEdge(
						star, this.selectedStars[this.selectedStars.length-2], 0xa0a050
					));
				}
			}

		}
	}
};

function createPatternEdge(star1, star2, edgecolor=0x505050) { // id: star1 < star2
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
		new THREE.LineBasicMaterial({ color : edgecolor })
	);
	edge.userData = { id1 : star1.userData.id, id2 : star2.userData.id };
	constellation.add(edge);
	return edge;
}

const constellation_list = [];
const constellation_found = [];

function findPatterns(edge_list) {
	// sort edge_list
	edge_list.sort(function(edge1, edge2) {
		if(edge1.userData.id1 < edge2.userData.id1) {
			return -1;
		}
		else if(edge1.userData.id1 > edge2.userData.id1) {
			return 1;
		}
		else {
			if(edge1.userData.id2 < edge2.userData.id2) {
				return -1;
			}
			else {
				return 1;
			}
		}
	});
	// compare
	for(let i=1; i<=88; i++) {
		const correct_edge_list = constellation_list[i];
		if(edge_list.length != correct_edge_list.length) {
			continue;
		}
		let matched = true;
		for(let j=0; j<edge_list.length; j++) {
			if( edge_list[j].userData.id1 != correct_edge_list[j].userData.id1 ||
				edge_list[j].userData.id2 != correct_edge_list[j].userData.id2 ) {
					matched = false;
					break;
			}
		}
		if(matched) {
			constellation_found[i] = true;
			ui_update();
			edge_list.forEach((edge) => {
				edge.material.color = new THREE.Color(0xffffff);
			});
			constellation_list[i].forEach((edge) => {
				edge.material.color = new THREE.Color(0xa0a0a0);
			});
		}
	}
	// if matched, change color(edge_list) and make visible(constellation_list.edge_list)
	// fadeout edges
	edge_list.forEach((edge) => {
		fadeoutEffect.push(
			{object: edge, time: 1, action: function() {constellation.remove(this.object);}}
		);
	});
}

function init_constellation() {
	starData.forEach((starInfo) => {
		const starMesh = new THREE.Mesh(starGeo, starMat);
		const star = new THREE.Mesh(starSelectionGeo, starSelectionMat.clone());
		star.add(starMesh);
		starMesh.scale.multiplyScalar(6-starInfo.mag);
		star.position.setFromSphericalCoords(starDistance, starInfo.phi * Math.PI / 180, starInfo.theta * Math.PI / 180);
		star.userData = { id : starInfo.id, constellation_id : starInfo.constellation_id };
		celestial.add(star);
	});
	celestial.position.set(0, -120, 0);
	scene.add(celestial);

	constellation.position.copy(celestial.position);
	scene.add(constellation);

	function findStar(id) {
		const list = celestial.children;
		for(let i=0; i<list.length; i++) {
			if(list[i].userData.id == id) {
				return list[i];
			}
		}
		return null;
	}
	
	patternData.forEach((patternInfo) => {
		while(constellation_list.length <= patternInfo.id) {
			constellation_list.push([]);
			constellation_found.push(false);
		}
		constellation_list[patternInfo.id].push(
			createPatternEdge(findStar(patternInfo.star1), findStar(patternInfo.star2), 0x080808)
		);
	});
	constellation_list.forEach((constellation) => {
		constellation.sort(function(edge1, edge2) {
			if(edge1.userData.id1 < edge2.userData.id1) {
				return -1;
			}
			else if(edge1.userData.id1 > edge2.userData.id1) {
				return 1;
			}
			else {
				if(edge1.userData.id2 < edge2.userData.id2) {
					return -1;
				}
				else {
					return 1;
				}
			}
		});
	});
}


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
		ui_7.visible = false;
	}
	else if(intersections[0].object.userData.id == 0) {
		// no stars selected
		starSelectionManager.unselect();
		ui_7.visible = false;
	}
	else {
		// star selected
		const star = intersections[0].object;
		starSelectionManager.select(star);
		if(uiMode == 'playing') {
			ui_7.visible = true;
		}
		if(inputs['tab']) {
			ui_7.material.map = constellationImages_simple[star.userData.constellation_id-1];
		}
		else {
			ui_7.material.map = constellationImages[star.userData.constellation_id-1];
		}
console.log(star.userData.id);
	}

	// apply effect
	for(let i=fadeoutEffect.length-1; i>=0; i--) {
		const element = fadeoutEffect[i];
		if(element.time <= 0) {
			element.action();
			fadeoutEffect.splice(i, 1);
		}
		else {
			const dt = Math.min(element.time, t);
			if(element.object.isLine) {
				element.object.material.color.multiplyScalar(1 - dt / element.time);
			}
			else {
				element.object.material.transparent = true;
				element.object.material.opacity *= (1 - dt / element.time);
			}
			element.time -= t;
		}
	}

	// set background color
	raycaster.set( camera.position, new THREE.Vector3(0, -1, 0) );
	if(raycaster.intersectObject(surface).length == 0) {
		background.material.color = new THREE.Color(0x101050);
	}
	else {
		background.material.color = new THREE.Color(0x000010);
	}
	renderer.clear();
	renderer.render(scene, camera);
	renderer.render(scene_ui, camera_ui);
	// stop the loop if paused
	if(clock.running) {
		requestAnimationFrame(render);
	}
}



function init_ui() {
	camera_ui.position.set(0, 0, -500);
	camera_ui.lookAt(0, 0, 0);
	scene_ui.add(camera_ui);
	onresize_ui();
}


function initialize() {
	// renderer
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000);
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);
	//camera
	cameraController.disposeOrbitControls();
	camera.position.set(-40, 30, 50); // 0, 40, 80
	camera.lookAt(0, 0, 0);
	scene.add(camera);
	init_constellation();
	init_ui();

  /*** Add event listeners ***/
	// window
	window.onresize = () =>
	{
	    camera.aspect = window.innerWidth / window.innerHeight;
	    camera.updateProjectionMatrix();

		camera_ui.left = -window.innerWidth / 2;
		camera_ui.right = window.innerWidth / 2;
		camera_ui.top = window.innerHeight / 2;
		camera_ui.bottom = -window.innerHeight / 2;
		camera_ui.updateProjectionMatrix();

	    renderer.setSize(window.innerWidth, window.innerHeight);
		onresize_ui();
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
		switch(uiMode) {
		case 'init':
			uiMode = 'waiting';
			fadeoutEffect.push(
				{object: ui_0, time: 1.5, action: function() {
					scene_ui.remove(ui_0);
				}},
				{object: ui_1, time: 1.5, action: function() {
					scene_ui.remove(ui_1);
					ui_update();
					ui_8.visible = true;
				}}
			);
			cameraController.switchMode(
				2,
				75,
				new THREE.Vector3(0, 4, 25),
				new THREE.Vector3(),
				function() {uiMode = 'playing';}
			);
			break;
		case 'playing':
			fadeoutEffect.push(
				{object: ui_8, time: 1.5, action: function() {
					scene_ui.remove(ui_8);
				}}
			);
			starSelectionManager.onpointerdown();
		}
	}
	window.onpointerup = () =>
	{
		switch(uiMode) {
		case 'playing':
			starSelectionManager.onpointerup();
		}
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
		if(uiMode == 'playing' || uiMode == 'waiting') {
			if(key in inputs) {
				inputs[key] = true;
				e.preventDefault();
			}
		}
		if(uiMode == 'playing' && key == 'r') {
			uiMode = 'waiting';
			if(camera.fov == 75) {
				const newpos = new THREE.Vector3().copy(camera.position);
				newpos.y = 0;
				newpos.setLength(5);
				newpos.y = -4;
				cameraController.switchMode(
					0.5,
					120,
					newpos,
					new THREE.Vector3(),
					function() {
						cameraController.orbitControls.enableZoom = false;
						uiMode = 'playing';
					}
				);
			}
			else if(camera.fov == 120) {
				const newpos = new THREE.Vector3().copy(camera.position);
				newpos.y = 0;
				newpos.setLength(15);
				newpos.y = -4;
				cameraController.switchMode(
					0.5,
					45,
					newpos,
					new THREE.Vector3(),
					function() {
						cameraController.orbitControls.enableZoom = false;
						uiMode = 'playing';
					}
				);
			}
			else if(camera.fov == 45) {
				const newpos = new THREE.Vector3().copy(camera.position);
				newpos.y = 0;
				newpos.setLength(25);
				newpos.y = 4;
				cameraController.switchMode(
					0.5,
					75,
					newpos,
					new THREE.Vector3(),
					function() {
						uiMode = 'playing';
					}
				);
			}
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







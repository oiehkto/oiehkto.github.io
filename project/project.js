import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { starData } from './starData.js';
import { patternData } from './patternData.js';

/*** Global ***/
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias : true });
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const clock = new THREE.Clock(false);
const raycaster = new THREE.Raycaster();
const mousePointer = new THREE.Vector2();
const inputs = { 'w' : false, 'a' : false, 's' : false, 'd' : false, 'tab' : false };
let gamePhase = 'init';

const scene_ui = new THREE.Scene();
const camera_ui = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 1, 1000);
const ui = []; // {sprite, scaleX, scaleY, posX, posY}
const numberImages = [];
const constellationImages = [];
const constellationImages_simple = [];

/*** Scene objects ***/

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

// Spot light
const spotLight = new THREE.SpotLight();
spotLight.intensity = 10;
spotLight.decay = 0;
spotLight.position.set(0, 20, 0);
spotLight.penumbra = 0.5;
scene.add( spotLight );

// Background
const backgroundGeo = new THREE.SphereGeometry(160);
const backgroundMat = new THREE.MeshBasicMaterial({color : 0x000000, side : THREE.BackSide});
const background = new THREE.Mesh(backgroundGeo, backgroundMat);
scene.add( background );

// Stars
const celestial_radius = 200;
const group_stars_selectable = new THREE.Group();
const group_stars_background = new THREE.Group();
const group_lines = new THREE.Group();
const starGeo = new THREE.SphereGeometry(celestial_radius / 1000);
const starMat = new THREE.MeshStandardMaterial({color : 0xffffff, emissive : 0xffffff});
const starSelectionGeo = new THREE.SphereGeometry(celestial_radius / 80);
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
scene.add( surface );
const z_velocity = new Float32Array((segments + 1) ** 2); // velocity of points in plane

// Boat
const boatGeometry = new THREE.CapsuleGeometry(1, 1);
const boatMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff} ); 
const boatMesh = new THREE.Mesh( boatGeometry, boatMaterial );
const boatLight = new THREE.PointLight(0xffffff, 10000, 0, 2);

const boat = new THREE.Group();
boat.add( boatMesh );
boat.add( boatLight );
scene.add( boat );




function ui_update() {
	// change number of found constellations, current constellation image
	let n_found = 0;
	constellation_found.forEach((found) => {
		if(found) {n_found++;}
	});
	ui[3].sprite.visible = true;
	ui[4].sprite.visible = true;
	ui[5].sprite.visible = true;
	ui[6].sprite.visible = true;
	const dec = Math.floor(n_found / 10);
	if(dec == 0) {
		ui[2].sprite.visible = false;
	}
	else {
		ui[2].sprite.visible = true;
		ui[2].sprite.material.map = numberImages[dec];
	}
	ui[3].sprite.material.map = numberImages[n_found % 10];
}

function ui_resize() {
	const windowSize = new THREE.Vector2(window.innerWidth, window.innerHeight);
	ui.forEach((ui_element) => {
		ui_element.sprite.scale.set(ui_element.scaleX.dot(windowSize), ui_element.scaleY.dot(windowSize), 1);
		ui_element.sprite.position.set(ui_element.posX.dot(windowSize), ui_element.posY.dot(windowSize), 0);
	});
}

function init_ui() {
	scene_ui.add(camera_ui);
	camera_ui.position.set(0, 0, -500);
	camera_ui.lookAt(0, 0, 0);
	// Load textures
	const textureLoader = new THREE.TextureLoader();
	for(let i=0; i<10; i++) {
		numberImages.push(textureLoader.load('textures/number_'+i+'.png'));
	}
	numberImages.push(textureLoader.load('textures/number_s.png'));
	for(let i=1; i<=88; i++) {
		constellationImages.push(textureLoader.load('textures/constellation_patterns/0'+i+'.png'));
		constellationImages_simple.push(textureLoader.load('textures/constellation_patterns/'+i+'.png'));
	}
	// Add UI
	function add_ui(texture, initial_visibility, center, scaleX, scaleY, posX, posY) {
		const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
			map : texture
		}));
		sprite.visible = initial_visibility;
		sprite.center = center;
		scene_ui.add(sprite);
		ui.push({ sprite : sprite, scaleX : scaleX, scaleY : scaleY, posX : posX, posY : posY });
	}

	add_ui(textureLoader.load('textures/title.png'), true,
		new THREE.Vector2(),
		new THREE.Vector2(0.4, 0), new THREE.Vector2(0.08, 0),
		new THREE.Vector2(0.4, 0), new THREE.Vector2()
	);
	add_ui(textureLoader.load('textures/click_to_start.png'), true,
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.09, 0), new THREE.Vector2(0.018, 0),
		new THREE.Vector2(), new THREE.Vector2(0, -0.4)
	);
	add_ui(numberImages[0], false,
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.01, 0), new THREE.Vector2(0.02, 0),
		new THREE.Vector2(0.02, 0), new THREE.Vector2(0, -0.4)
	);
	add_ui(numberImages[0], false,
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.01, 0), new THREE.Vector2(0.02, 0),
		new THREE.Vector2(0.01, 0), new THREE.Vector2(0, -0.4)
	);
	add_ui(numberImages[10], false,
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.01, 0), new THREE.Vector2(0.02, 0),
		new THREE.Vector2(), new THREE.Vector2(0, -0.4)
	);
	add_ui(numberImages[8], false,
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.01, 0), new THREE.Vector2(0.02, 0),
		new THREE.Vector2(-0.01, 0), new THREE.Vector2(0, -0.4)
	);
	add_ui(numberImages[8], false,
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.01, 0), new THREE.Vector2(0.02, 0),
		new THREE.Vector2(-0.02, 0), new THREE.Vector2(0, -0.4)
	);
	add_ui(constellationImages[0], false,
		new THREE.Vector2(),
		new THREE.Vector2(0, 0.3), new THREE.Vector2(0, 0.3),
		new THREE.Vector2(0.5, 0), new THREE.Vector2(0, -0.5)
	);
	add_ui(textureLoader.load('textures/guide.png'), false,
		new THREE.Vector2(0.5, 0.5),
		new THREE.Vector2(0.47, 0), new THREE.Vector2(0.25, 0),
		new THREE.Vector2(), new THREE.Vector2()
	);
	// Set UI size
	ui_resize();
}

function init_renderer() {
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000);
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);
}

function init_camera() {
	scene.add(camera);
	camera.position.set(-40, 30, 50);
	camera.lookAt(0, 0, 0);
}



function init_scene() {
	background.userData = { id : 0 };
	surface.position.y = -5;
	surface.rotation.x = -Math.PI / 2;
	boatMesh.rotation.x = -Math.PI / 2;
	boatLight.position.y = 1;
	boat.userData = { yVelocity : 0 };
	boat.position.copy(surface.position);
}



const timer = {time : 0.0, period : 0.1, update : function(t) {
	this.time += t;
	if(this.time > this.period) {
		this.time -= this.period;
		return true;
	} else {
		return false;
	} }
};

function setBoatY(y, t) {
	const maxAcceleration = 10;
	const y_vel = (y - boat.position.y) / t;
	const y_acc = (y_vel - boat.userData.yVelocity) / t;
	boat.userData.yVelocity += t * Math.max(-maxAcceleration, Math.min(maxAcceleration, y_acc));
	boat.position.y += t * boat.userData.yVelocity;
}

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
	setBoatY(boat_y, t);
	// update attributes of plane
	z_velocity.set(new_v);
	surfaceGeometry.setAttribute('position', attr);
	surfaceGeometry.setAttribute('normal', normal);
}

const fadeoutEffect = [];

const cameraController = {
	isOrbitControlOn : false,
	orbitControls : null,
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
	const v1 = group_stars_selectable.worldToLocal(star1.getWorldPosition(new THREE.Vector3()));
	const v2 = group_stars_selectable.worldToLocal(star2.getWorldPosition(new THREE.Vector3()));
	const theta = v1.angleTo(v2);
	const curve = new THREE.EllipseCurve(0, 0, celestial_radius, celestial_radius, (Math.PI-theta)/2, (Math.PI+theta)/2);

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
	group_lines.add(edge);
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
		// if matched, change color(edge_list) and make visible(constellation_list[i])
		if(matched) {
			constellation_found[i] = true;
			ui_update();
			edge_list.forEach((edge) => {
				edge.material.color = new THREE.Color(0x50ff50);
			});
			constellation_list[i].forEach((edge) => {
				edge.material.color = new THREE.Color(0xa0a0a0);
			});
			break;
		}
		edge_list.forEach((edge => {
			edge.material.color = new THREE.Color(0xff5000);
		}));
	}
	// fadeout edges
	edge_list.forEach((edge) => {
		fadeoutEffect.push(
			{object: edge, time: 1, action: function() {group_lines.remove(this.object);}}
		);
	});
}

function init_sky() {
	starData.forEach((starInfo) => {
		const starMesh = new THREE.Mesh(starGeo, starMat);
		const star = new THREE.Mesh(starSelectionGeo, starSelectionMat.clone());
		star.add(starMesh);
		starMesh.scale.multiplyScalar(1.5+Math.exp(1-starInfo.mag));
		star.position.setFromSphericalCoords(celestial_radius, starInfo.phi * Math.PI / 180, starInfo.theta * Math.PI / 180);
		star.userData = { id : starInfo.id, constellation_id : starInfo.constellation_id };
		group_stars_selectable.add(star);
	});
	for(let i=0; i<1000; i++) {
		const star = new THREE.Mesh(starGeo, starMat);
		star.scale.multiplyScalar(0.4);
		star.position.randomDirection().multiplyScalar(celestial_radius);
		group_stars_background.add(star);
	}

	group_stars_selectable.position.set(0, -120, 0);
	scene.add(group_stars_selectable);

	group_stars_background.position.copy(group_stars_selectable.position);
	scene.add(group_stars_background);

	group_lines.position.copy(group_stars_selectable.position);
	scene.add(group_lines);

	function findStar(id) {
		const list = group_stars_selectable.children;
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
	group_stars_selectable.rotateOnWorldAxis( axis, rotAngle );
	group_stars_background.rotateOnWorldAxis( axis, rotAngle );
	group_lines.rotateOnWorldAxis( axis, rotAngle );
	// Update surface geometry
	updateSurface(t);


	// select stars
	raycaster.setFromCamera( mousePointer, camera );
	const intersections = raycaster.intersectObjects([background, ...group_stars_selectable.children], false);
	if(intersections.length == 0) {
		// camera is not in the background sphere
		starSelectionManager.unselect();
		ui[7].sprite.visible = false;
	}
	else if(intersections[0].object.userData.id == 0) {
		// no stars selected
		starSelectionManager.unselect();
		ui[7].sprite.visible = false;
	}
	else {
		// star selected
		const star = intersections[0].object;
		starSelectionManager.select(star);
		if(gamePhase == 'playing') {
			ui[7].sprite.visible = true;
		}
		if(inputs['tab']) {
			ui[7].sprite.material.map = constellationImages_simple[star.userData.constellation_id-1];
		}
		else {
			ui[7].sprite.material.map = constellationImages[star.userData.constellation_id-1];
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



async function initialize() {
	init_renderer();
	init_camera();
	init_scene();

	init_sky();
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
		ui_resize();
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
		switch(gamePhase) {
		case 'init':
			gamePhase = 'waiting';
			fadeoutEffect.push(
				{object: ui[0].sprite, time: 1.5, action: function() {
					scene_ui.remove(ui[0].sprite);
				}},
				{object: ui[1].sprite, time: 1.5, action: function() {
					scene_ui.remove(ui[1].sprite);
					ui_update();
					ui[8].sprite.visible = true;
				}}
			);
			cameraController.switchMode(
				2,
				75,
				new THREE.Vector3(0, 4, 25),
				new THREE.Vector3(),
				function() {gamePhase = 'playing';}
			);
			break;
		case 'playing':
			fadeoutEffect.push(
				{object: ui[8].sprite, time: 1.5, action: function() {
					scene_ui.remove(ui[8].sprite);
				}}
			);
			starSelectionManager.onpointerdown();
		}
	}
	window.onpointerup = () =>
	{
		switch(gamePhase) {
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
		if(gamePhase == 'playing' || gamePhase == 'waiting') {
			if(key in inputs) {
				inputs[key] = true;
				e.preventDefault();
			}
		}
		if(gamePhase == 'playing' && key == 'r') {
			gamePhase = 'waiting';
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
						gamePhase = 'playing';
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
						gamePhase = 'playing';
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
						gamePhase = 'playing';
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
await initialize();
clock.start();
render();







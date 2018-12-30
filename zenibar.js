let gl;
let meshes = [];
let textures = {};
let materials = {};
let scene = [];

function main() {
	const canvas = document.getElementById("scene");
	initGL(canvas);
	initEvents(canvas);
	loadTextures();
	initMaterials();
	loadScene();

	drawScene();
}

/**
 * Initialize the WebGL2 context into the main "gl" variable
 * @param canvas {HTMLElement}
 */
function initGL(canvas) {
	gl = canvas.getContext("webgl2");

	if (!gl) {
		canvas.style.display = "none";
		document.getElementById("noContextLayer").style.display = "block";
	}
	else {
		drawMode = gl.TRIANGLES;
	}
}

/**
 * Initialize mouse and keyboard events to move the scene view
 * @param canvas
 */
function initEvents(canvas) {
	// Mouse interaction
	canvas.addEventListener("mousedown", handleMouseDown, false);
	canvas.addEventListener("mouseup", handleMouseUp, false);
	canvas.addEventListener("mouseout", handleMouseUp, false);
	canvas.addEventListener("mousemove", handleMouseMove, false);
	canvas.addEventListener("mousewheel", handleMouseWheel, false);
	canvas.addEventListener("DOMMouseScroll", handleMouseWheel, false);

	document.addEventListener("keydown", handleKeyDown, true);
}

let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;

let globalSceneViewMatrix = mat4.create();
mat4.identity(globalSceneViewMatrix);

function handleMouseDown(event) {
	mouseDown = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;

	return false;
}

function handleMouseUp(event) {
	mouseDown = false;
}

function handleMouseMove(event) {
	if (!mouseDown) {
		return;
	}
	let newX = event.clientX;
	let newY = event.clientY;

	let deltaX = newX - lastMouseX;
	let newRotationMatrix = mat4.create();
	mat4.identity(newRotationMatrix);
	mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

	var deltaY = newY - lastMouseY;
	mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);
	mat4.multiply(globalSceneViewMatrix, newRotationMatrix, globalSceneViewMatrix);

	lastMouseX = newX;
	lastMouseY = newY;

	return false;
}

function handleMouseWheel(event) {

	mat4.translate(globalSceneViewMatrix, globalSceneViewMatrix, [event.deltaX / 30., 0, event.deltaY / 30.]);

	event.preventDefault();

	return false;
}

function handleKeyDown(event) {
	if (event.key === "l" || event.key === "L") {
		useLight = !useLight;
	}

	else if (event.key === "w" || event.key === "W") {
		drawMode = gl.LINES;
	}
	else if (event.key === "t" || event.key === "T") {
		drawMode = gl.TRIANGLES;
	}
	else if (event.key === "p" || event.key === "P") {
		drawMode = gl.POINTS;
	}

}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

/**
 * Create a list of materials to be used by the meshes
 */
function initMaterials() {

	let phongProgram = initShaderProgram("phong-vshader", "phong-fshader");
	let phong = {
		useTexture: true,
		texture: textures.biere,
		ka: 1.0,
		kd: 1.0,
		ks: 1.0,
		shininess: 90,
		ambientColor: [0.1, 0.1, 0.1],
		diffuseColor: [0.933, 0.737, 0.204],
		specularColor: [1., 1., 1.],
		program: phongProgram,
		programParams: {
			globals: {
				vertexPosition: gl.getAttribLocation(phongProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(phongProgram, 'aTextureCoord'),
				vertexNormal: gl.getAttribLocation(phongProgram, 'aVertexNormal'),

				projectionMatrix: gl.getUniformLocation(phongProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(phongProgram, 'uModelViewMatrix'),
				normalMatrix: gl.getUniformLocation(phongProgram, 'uNormalMatrix'),

				useTexture: gl.getUniformLocation(phongProgram, "uUseTexture"),
				uSampler: gl.getUniformLocation(phongProgram, 'uSampler'),

				useLight: gl.getUniformLocation(phongProgram, "uUseLight"),
				lightPos: gl.getUniformLocation(phongProgram, "uLightPos"),
				lightColor: gl.getUniformLocation(phongProgram, "uLightColor")
			},

			ka: gl.getUniformLocation(phongProgram, "uKa"),
			kd: gl.getUniformLocation(phongProgram, "uKd"),
			ks: gl.getUniformLocation(phongProgram, "uKs"),
			shininess: gl.getUniformLocation(phongProgram, "uShininess"),
			ambientColor: gl.getUniformLocation(phongProgram, "uAmbientColor"),
			diffuseColor: gl.getUniformLocation(phongProgram, "uDiffuseColor"),
			specularColor: gl.getUniformLocation(phongProgram, "uSpecularColor")
		}
	};

	materials.phong = phong;
}

/**
 * Initialize Vertex and Fragment shaders + "linked" program
 * @param vertexShaderSrcID {String}
 * @param fragmentShaderSrcID {String}
 * @returns {WebGLProgram}
 * */
function initShaderProgram(vertexShaderSrcID, fragmentShaderSrcID) {
	let vertexShaderSource = document.getElementById(vertexShaderSrcID).text;
	let fragmentShaderSource = document.getElementById(fragmentShaderSrcID).text;

	let vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

	return createProgram(vertexShader, fragmentShader);
}

/**
 * Load a "shader" script into a shader object (WebGLShader)
 * @param type {number} gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param source {String} source code for the shader
 * @returns {WebGLShader}
 */
function createShader(type, source) {
	let shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

/**
 * Link both Vertex and Fragment shaders into a "Program" (WebGLProgram)
 * @param vertexShader {WebGLShader}
 * @param fragmentShader {WebGLShader}
 * @returns {WebGLProgram}
 */
function createProgram(vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}


function loadTextures() {
	textures.biere = loadTexture("assets/biere-mousse-carre.jpg");
	textures.biere2 = loadTexture("assets/biere2.jpg");
}

/**
 *
 * @param url {String}
 * @returns {WebGLTexture}
 */
function loadTexture(url) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	gl.texImage2D(gl.TEXTURE_2D,
	              level, // level
	              internalFormat, // internalFormat
	              1, // width
	              1, // height
	              0, // border
	              srcFormat,
	              srcType,
	              new Uint8Array([255, 0, 0, 255]) // default color value
	);

	//image is loaded asynchronously
	const image = new Image();
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

		gl.generateMipmap(gl.TEXTURE_2D);
	};
	image.src = url;

	return texture;
}

function loadScene() {
	loadMeshes();

	//todo : grille 3D de cubes
	//todo : animer la grille (Y des vertices)

	let eltGrid = {
		mesh: meshes[0], // grid mesh
		translation: [0, 0, -20],
		rotation: [.1, 0, 0],
		scale: [1, 1, 1],
		material: materials.phong
	};
	scene.push(eltGrid);

	let eltCube1 = {
		mesh: meshes[1], // cube mesh
		translation: [-5, 1, -20],
		rotation: [.1, 0.1, 0],
		scale: [1, 1, 1],
		material: materials.phong
	};
	scene.push(eltCube1);

	let eltCube2 = {
		mesh: meshes[1], // re-use the same cube mesh
		translation: [5, 1, -15],
		rotation: [.1, 1, 0],
		scale: [1, 1, 1],
		material: materials.phong,
	};
	eltCube2.material.texture = textures.biere2;
	eltCube2.material.useTexture = false;
	scene.push(eltCube2);
}

/**
 * Load meshes into the "meshes" global array
 */
function loadMeshes() {
	meshes.push(initGridBuffers());

	meshes.push(initCubeBuffers());

	loadObjFile("assets/Bottle/12178_bottle_v1_L2.obj")
		.then(result => {
			      let bottle = createBufferFromData(result);
			      meshes.push(bottle);
			      let eltBottle = {
				      mesh: bottle,
				      translation: [0, 1, -20],
				      rotation: [-Math.PI / 2., 0, 0],
				      scale: [0.1, 0.1, 0.1],
				      material: materials.phong
			      };
			      scene.push(eltBottle);
		      }, error => alert(error)
		);
}


function createBufferFromData(data) {

	// Buffer for the cube's vertices positions.
	const positionsBuffer = gl.createBuffer();
	// Buffer to hold indices into the vertex array for each faces's vertices.
	const indicesBuffer = gl.createBuffer();
	// Buffer for normals
	const normalsBuffer = gl.createBuffer();
	// Buffer for texture coordinates
	let textureCoordsBuffer = gl.createBuffer();


	// Bind to the positionsBuffer
	gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
	// Fill the buffer with vertices positions
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

	//if (data.textures !== undefined && data.textures !== null) {
	gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.textures), gl.STATIC_DRAW);
	//}

	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertexNormals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

	return {
		verticesBuffer: positionsBuffer,
		textureCoordsBuffer: textureCoordsBuffer,
		normalsBuffer: normalsBuffer,
		indicesBuffer: indicesBuffer,
		data: data
	};

}

/**
 * Load external Obj file
 * @param url {String}
 * @returns {Promise<any>}
 */
function loadObjFile(url) {

	return new Promise((resolve, reject) => {

		fetch(url)
			.then(resp => {
				return resp.text();
			})
			.then(data => {
				let mesh = new OBJ.Mesh(data);
				resolve(mesh);
			})
			.catch(function (error) {
				reject(JSON.stringify(error));
			});
	});
}

/**
 * Initialize the buffers for the Grid
 * @returns {{verticesBuffer, textureCoordsBuffer, colorsBuffer, normalsBuffer, indicesBuffer, data}}
 */
function initGridBuffers() {

	// Define the position for each vertex of each face
	let positions = [];
	let normals = [];
	let indices = [];
	let colors = [];
	let textureCoordinates = [];

	let width = 0.4; // width of a square
	let nbW = 50; // number of squares on X axis
	let nbH = 50; // number of squares on Z axis
	let index = 0;
	let startX = -nbW * width / 2.; // try to center the grid by translating its start point half its size
	let startY = 0.;
	let startZ = -nbH * width / 2.;
	let c = [0.878, 0.592, 0.400, 1.0]; // orange

	// fill positions, normals, uv, colors and indices in a single double-loop
	for (let h = 0; h <= nbH; h++) {
		for (let w = 0; w <= nbW; w++) {
			positions[index + 0] = startX + w * width; // x
			positions[index + 1] = startY + Math.random() / 3.0; // y
			positions[index + 2] = startZ + h * width; // z

			normals[index + 0] = 0.0; // x
			normals[index + 1] = 1.0; // y
			normals[index + 2] = 0.0; // z

			colors = colors.concat(c);

			textureCoordinates = textureCoordinates.concat(w / nbW, h / nbH); // u, v

			// Each square of the grid is composed by 2 triangles.
			// Each triangle is composed with 3 vertices. "indices" stores the indices in the "positions" array of these vertices, counter-clock wise.
			if (w < nbW && h < nbH) {
				let i = w + (h * (nbW + 1));
				indices = indices.concat(i, i + nbW + 1, i + nbW + 2); // 1st triangle of the square
				indices = indices.concat(i, i + nbW + 2, i + 1); // 2nd triangle of the square
			}
			index += 3;
		}
	}

	return createBufferFromData({
		                            vertices: positions,
		                            textures: textureCoordinates,
		                            colors: colors,
		                            vertexNormals: normals,
		                            indices: indices
	                            }
	);
}

/**
 * Initialize the buffers for the Cube we'll display
 * @returns {{verticesBuffer, textureCoordsBuffer, colorsBuffer, normalsBuffer, indicesBuffer, data}}
 */
function initCubeBuffers() {

	// Define the position for each vertex of each face
	const positions = [
		// Front
		-1.0, -1.0, 1.0, //x, y, z
		1.0, -1.0, 1.0,
		1.0, 1.0, 1.0,
		-1.0, 1.0, 1.0,

		// Back
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, -1.0, -1.0,

		// Top
		-1.0, 1.0, -1.0,
		-1.0, 1.0, 1.0,
		1.0, 1.0, 1.0,
		1.0, 1.0, -1.0,

		// Bottom
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, 1.0,
		-1.0, -1.0, 1.0,

		// Right
		1.0, -1.0, -1.0,
		1.0, 1.0, -1.0,
		1.0, 1.0, 1.0,
		1.0, -1.0, 1.0,

		// Left
		-1.0, -1.0, -1.0,
		-1.0, -1.0, 1.0,
		-1.0, 1.0, 1.0,
		-1.0, 1.0, -1.0
	];

	// Texture coordinates
	const textureCoordinates = [
		// Front
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Back
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Top
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Bottom
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Right
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Left
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
	];

	const faceColors = [
		[0.933, 0.737, 0.204, 1.0],    // Front: yellow
		[0.357, 0.608, 0.835, 1.0],    // Back: blue
		[0.588, 0.722, 0.482, 1.0],    // Top: green
		[0.878, 0.592, 0.400, 1.0],    // Bottom: orange
		[0.760, 0.494, 0.815, 1.0],    // Right: violet
		[0.267, 0.329, 0.415, 1.0]     // Left: gray
	];
	// Let's create an array with 4 colors per face (1 per vertex, same color for the 4 vertices of a face)
	let colors = [];
	for (let j = 0; j < faceColors.length; ++j) {
		const c = faceColors[j];
		colors = colors.concat(c, c, c, c);

	}

	const normals = [
		// Front
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		// Back
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		// Top
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		// Bottom
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,

		// Right
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		// Left
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0
	];

	// indices of vertices for each face
	const indices = [
		0, 1, 2, 0, 2, 3,         // front
		4, 5, 6, 4, 6, 7,         // back
		8, 9, 10, 8, 10, 11,      // top
		12, 13, 14, 12, 14, 15,   // bottom
		16, 17, 18, 16, 18, 19,   // right
		20, 21, 22, 20, 22, 23,   // left
	];

	return createBufferFromData({
		                            vertices: positions,
		                            textures: textureCoordinates,
		                            colors: colors,
		                            vertexNormals: normals,
		                            indices: indices
	                            }
	);
}

function drawMesh(projectionMatrix, elt) {

	let programParams = elt.material.programParams;

	let modelViewMatrix = mat4.create();
	// move object
	{
		let worldMatrix = mat4.create();
		mat4.invert(worldMatrix, globalSceneViewMatrix);
		mat4.multiply(modelViewMatrix, modelViewMatrix, worldMatrix);

		mat4.translate(modelViewMatrix, modelViewMatrix, elt.translation);

		mat4.rotate(modelViewMatrix, modelViewMatrix, elt.rotation[0], [1, 0, 0]); // X
		mat4.rotate(modelViewMatrix, modelViewMatrix, elt.rotation[1], [0, 1, 0]); // Y
		mat4.rotate(modelViewMatrix, modelViewMatrix, elt.rotation[2], [0, 0, 1]); // Z


		mat4.rotate(modelViewMatrix, modelViewMatrix, time, [0, 1, 0]); // Y

		mat4.scale(modelViewMatrix, modelViewMatrix, elt.scale);
	}

	const normalMatrix = mat4.create();
	mat4.invert(normalMatrix, modelViewMatrix);
	mat4.transpose(normalMatrix, normalMatrix);

	// Set the vertexPosition attribute of the shader
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, elt.mesh.verticesBuffer);
		gl.vertexAttribPointer(programParams.globals.vertexPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programParams.globals.vertexPosition);
	}

	//Set the texture coordinates
	if (elt.material.texture !== null && elt.material.useTexture === true) {
		gl.bindBuffer(gl.ARRAY_BUFFER, elt.mesh.textureCoordsBuffer);
		gl.vertexAttribPointer(programParams.globals.textureCoord, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programParams.globals.textureCoord);
		// Tell WebGL we want to affect texture unit 0
		gl.activeTexture(gl.TEXTURE0);
		// Bind the texture to texture unit 0
		gl.bindTexture(gl.TEXTURE_2D, elt.material.texture);
	}

	// Normals
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, elt.mesh.normalsBuffer);
		gl.vertexAttribPointer(programParams.globals.vertexNormal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programParams.globals.vertexNormal);
	}

	// Set indices to use to index the vertices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elt.mesh.indicesBuffer);

	// Set the shader program to use
	gl.useProgram(elt.material.program);

	// Set the globals shader uniforms
	gl.uniformMatrix4fv(programParams.globals.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programParams.globals.modelViewMatrix, false, modelViewMatrix);
	gl.uniformMatrix4fv(programParams.globals.normalMatrix, false, normalMatrix);
	gl.uniform1i(programParams.globals.useTexture, elt.useTexture);

	gl.uniform1i(programParams.globals.useLight, useLight);
	gl.uniform3fv(programParams.globals.lightPos, lightPos);
	gl.uniform3fv(programParams.globals.lightColor, lightColor);

	//set specific shader uniforms
	for (const key in programParams) {
		if (key !== "globals" && programParams.hasOwnProperty(key)) {

			let value = elt.material[key];
			let type = typeof (value);

			if (type === "number") {
				gl.uniform1f(programParams[key], elt.material[key]);
			}
			else if (type === "boolean") {
				gl.uniform1i(programParams[key], elt.material[key]);
			}
			else if (type === "object") {
				if (Array.isArray(value)) {
					if (value.length === 2) {
						gl.uniform2fv(programParams[key], elt.material[key]);
					}
					else if (value.length === 3) {
						gl.uniform3fv(programParams[key], elt.material[key]);
					}
					else if (value.length === 4) {
						gl.uniform4fv(programParams[key], elt.material[key]);
					}
				}
			}

		}
	}


	// Let's render
	gl.drawElements(drawMode,
	                elt.mesh.data.indices.length, // count (number of indices)
	                gl.UNSIGNED_SHORT, // type
	                0 // offset
	);

}

let time = 0.0;
let useLight = true;
let lightPos = [10.0, 10.0, 10.0];
let lightColor = [1.0, 1.0, 1.0];
let drawMode = 4;

/**
 * Render the scene
 */
function drawScene() {

	// Clear the color buffer
	gl.clearColor(0.0, 0.0, 0.0, 1);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix,
	                 45 * Math.PI / 180, // fieldOfView, in radians
	                 gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect
	                 0.1, // zNear,
	                 300 //zFar
	);

	for (let elt of scene) {
		drawMesh(projectionMatrix, elt);
	}

	time += 0.01;

	requestAnimationFrame(drawScene);
}


main();

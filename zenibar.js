let gl;
let meshes = [];
let textures = [];
let shaderProgramParams;

function main() {
	const canvas = document.getElementById("scene");
	initGL(canvas);
	initMouseEvents(canvas);
	initShaders();
	loadTextures();
	loadMeshes();

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
}

/**
 * Initialize mouse events to move the scene view
 * @param canvas
 */
function initMouseEvents(canvas) {
	// Mouse interaction
	canvas.addEventListener("mousedown", mouseDown, false);
	canvas.addEventListener("mouseup", mouseUp, false);
	canvas.addEventListener("mouseout", mouseUp, false);
	canvas.addEventListener("mousemove", mouseMove, false);
}

let drag = false;
let old_x, old_y;
let dX = 0, dY = 0;
let mouseDown = function (e) {
	drag = true;
	old_x = e.pageX;
	old_y = e.pageY;
	e.preventDefault();
	return false;
};

let mouseUp = function (e) {
	drag = false;
};

let mouseMove = function (e) {
	if (!drag) {
		return false;
	}
	dX = (e.pageX - old_x);// * 2 * Math.PI / canvas.width;
	dY = (e.pageY - old_y);// * 2 * Math.PI / canvas.height;
	old_x = e.pageX;
	old_y = e.pageY;
	e.preventDefault();
};

/**
 * initialize all shader programs
 * @returns {{program: WebGLProgram, vertexPosition: GLint, vertexNormal: GLint, textureCoord: GLint, vertexColor: GLint, projectionMatrix: WebGLUniformLocation, modelViewMatrix: WebGLUniformLocation, normalMatrix: WebGLUniformLocation, uSampler: WebGLUniformLocation}}
 */
function initShaders() {
	// let's initialize the shaders and the linked program
	const shaderProgram = initShaderProgram("vshader-simple", "fshader-simple");

	shaderProgramParams = {
		program: shaderProgram,

		vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
		textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
		vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),

		projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
		modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),

		uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
		useTexture: gl.getUniformLocation(shaderProgram, "uUseTexture")
	};
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
	textures[0] = loadTexture("assets/biere-mousse-carre.jpg");
	textures[1] = loadTexture("assets/biere2.jpg");
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

/**
 * Load meshes into the "meshes" global array
 */
function loadMeshes() {
	meshes.push(initGridBuffers());

	loadObjFile("assets/Bottle/12178_bottle_v1_L2.obj")
		.then(result => {
			      meshes.push(createBufferFromData(result,
			                                       {translation: [0, 0, -20], rotation: [0, 0, 0], scale: [1, 1, 1]},
			                                       textures[0]
			                  )
			      );
		      }, error => alert(error)
		);
}

function loadObjFile(url) {

	return new Promise((resolve, reject) => {

		fetch(url)
			.then(resp => {
				return resp.text();
			})
			.then(data => {
				let content = data;
				let mesh = new OBJ.Mesh(content);
				resolve(mesh);
			})
			.catch(function (error) {
				reject(JSON.stringify(error));
			});
	});
}

function createBufferFromData(data, srt, texture) {

	// Buffer for the cube's vertices positions.
	const positionsBuffer = gl.createBuffer();
	// Buffer to hold indices into the vertex array for each faces's vertices.
	const indicesBuffer = gl.createBuffer();
	// Buffer for normals
	const normalsBuffer = gl.createBuffer();
	// Buffer for texture coordinates
	let textureCoordsBuffer = null;
	// Buffer for colors
	let colorsBuffer = null;


	// Bind to the positionsBuffer
	gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
	// Fill the buffer with vertices positions
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

	//if (data.textures !== undefined && data.textures !== null) {
		textureCoordsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.textures), gl.STATIC_DRAW);
	//}

	if (data.colors !== undefined && data.colors !== null) {
		colorsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.colors), gl.STATIC_DRAW);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

	return {
		verticesBuffer: positionsBuffer,
		textureCoordsBuffer: textureCoordsBuffer,
		colorsBuffer: colorsBuffer,
		normalsBuffer: normalsBuffer,
		indicesBuffer: indicesBuffer,
		data: data,
		translation: srt.translation,
		rotation: srt.rotation,
		scale: srt.scale,
		texture: texture,
		useTexture: texture !== null
	};

}

/**
 * Initialize the buffers for the Cube we'll display
 * @returns {{position: WebGLBuffer, textureCoord: WebGLBuffer, normal: WebGLBuffer, indices: WebGLBuffer}}
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
			positions[index + 1] = startY; // y
			positions[index + 2] = startZ + h * width; // z

			normals[index + 0] = 0.0; // x
			normals[index + 1] = Math.random();  //1.0; // y randomize the normal to see the light effect
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
		                            normals: normals,
		                            indices: indices
	                            },
	                            {
		                            translation: [0, 0, -20],
		                            rotation: [0.1, 0, 0],
		                            scale: [1, 1, 1]
	                            },
	                            null
	);
}

function drawMesh(projectionMatrix, shaderProgramParams, mesh) {
	let modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix,     // destination matrix
	               modelViewMatrix,     // matrix to translate
	               mesh.translation);        // amount to translate

	//let's rotate the global view
	mat4.rotate(modelViewMatrix,    // destination matrix
	            modelViewMatrix,    // matrix to rotate
	            mesh.rotation[0],        // amount to rotate in radians
	            [1, 0, 0]);         // axis to rotate around (X)
	mat4.rotate(modelViewMatrix,    // destination matrix
	            modelViewMatrix,    // matrix to rotate
	            mesh.rotation[1],        // amount to rotate in radians
	            [0, 1, 0]);         // axis to rotate around (Y)
	mat4.rotate(modelViewMatrix,    // destination matrix
	            modelViewMatrix,    // matrix to rotate
	            mesh.rotation[2],        // amount to rotate in radians
	            [0, 0, 1]);         // axis to rotate around (Z)

	mat4.scale(modelViewMatrix,
	           modelViewMatrix,
	           mesh.scale);

	const normalMatrix = mat4.create();
	mat4.invert(normalMatrix, modelViewMatrix);
	mat4.transpose(normalMatrix, normalMatrix);

	// Set the vertexPosition attribute of the shader
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.verticesBuffer);
		gl.vertexAttribPointer(
			shaderProgramParams.vertexPosition,
			3,      // size : X,Y,Z = 3 values
			gl.FLOAT,       // type
			false, // normalized
			0,      // stride
			0       // offset
		);
		gl.enableVertexAttribArray(shaderProgramParams.vertexPosition);
	}

	//Set the texture coordinates
	if (mesh.texture !== null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureCoordsBuffer);
		gl.vertexAttribPointer(
			shaderProgramParams.textureCoord,
			2, // size : U,V = 2 values
			gl.FLOAT, // type
			false, //normalized
			0, // stride
			0 // offset
		);
		gl.enableVertexAttribArray(shaderProgramParams.textureCoord);
		// Tell WebGL we want to affect texture unit 0
		gl.activeTexture(gl.TEXTURE0);
		// Bind the texture to texture unit 0
		gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
	}

	// Set the vertexColor attribute of the shader
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.colorsBuffer);
		gl.vertexAttribPointer(
			shaderProgramParams.vertexColor,
			4, // size : R,G,B,A = 4 values
			gl.FLOAT, // type
			false, // normalized
			0, // stride
			0 // offset
		);
		gl.enableVertexAttribArray(shaderProgramParams.vertexColor);
	}

	// Normals
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalsBuffer);
		gl.vertexAttribPointer(
			shaderProgramParams.vertexNormal,
			3, // size : X,Y,Z = 3 values
			gl.FLOAT, // type
			false, // normalized
			0, //stride
			0 //offste
		);
		gl.enableVertexAttribArray(shaderProgramParams.vertexNormal);
	}


	// Set indices to use to index the vertices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indicesBuffer);

	// Set the shader program to use
	gl.useProgram(shaderProgramParams.program);

	// Set the shader uniforms
	gl.uniformMatrix4fv(
		shaderProgramParams.projectionMatrix,
		false, // transpose
		projectionMatrix);
	gl.uniformMatrix4fv(
		shaderProgramParams.modelViewMatrix,
		false, // transpose
		modelViewMatrix);
	gl.uniformMatrix4fv(
		shaderProgramParams.normalMatrix,
		false, // transpose
		normalMatrix);
	gl.uniform1i(shaderProgramParams.useTexture, mesh.useTexture);

	// Let's render
	gl.drawElements(gl.TRIANGLES,
	                mesh.data.indices.length, // count (number of indices)
	                gl.UNSIGNED_SHORT, // type
	                0 // offset
	);
}

let time = 0.0;

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


	const fieldOfView = 45 * Math.PI / 180;   // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	//define the field of view / deepness
	const zNear = 0.1;
	const zFar = 100.0;

	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix,
	                 fieldOfView,
	                 aspect,
	                 zNear,
	                 zFar);

	for (let mesh of meshes) {
		drawMesh(projectionMatrix, shaderProgramParams, mesh);
	}

	time += 0.01;


	requestAnimationFrame(drawScene);
}


main();

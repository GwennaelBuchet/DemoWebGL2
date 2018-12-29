function main() {
	const canvas = document.getElementById("scene");
	const gl = canvas.getContext("webgl2");

	if (!gl) {
		canvas.style.display = "none";
		document.getElementById("noContextLayer").style.display = "block";
	}
	// let's initialize the shaders and the linked program
	const shaderProgram = initShaderProgram(gl, "vshader-simple", "fshader-simple");

	const shaderProgramParams = {
		program: shaderProgram,

		vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
		textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
		vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),

		projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
		modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
		uSampler: gl.getUniformLocation(shaderProgram, 'uSampler')
	};


	// set the geometry definition
	const cubeBuffers = initCubeBuffers(gl);
	const gridBuffers = initGridBuffers(gl);
	let meshBottle;

	const texture1 = loadTexture(gl, "assets/biere-mousse-carre.jpg");
	const texture2 = loadTexture(gl, "assets/biere2.jpg");
	loadObjFile("assets/Bottle/12178_bottle_v1_L2.obj")
		.then(result => {
			      meshBottle = createBufferFromData(gl, result);
			      requestAnimationFrame(render);
		      }, error => alert(error)
		);

	// let's render.
	// As it's now animated, we use the requestAnimationFrame function to smooth it up
	function render() {
		drawScene(gl, shaderProgramParams, gridBuffers, texture2, texture1);

		requestAnimationFrame(render);
	}

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

function createBufferFromData(gl, data) {

	// Buffer for the cube's vertices positions.
	const positionsBuffer = gl.createBuffer();
	// Buffer to hold indices into the vertex array for each faces's vertices.
	const indicesBuffer = gl.createBuffer();
	// Buffer for normals
	const normalBuffer = gl.createBuffer();
	// Buffer for texture coordinates
	const textureCoordBuffer = gl.createBuffer();


	// Bind to the positionsBuffer
	gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
	// Fill the buffer with vertices positions
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);


	gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.textures), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertexNormals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

	/**
	 * Actually, the mesh object (data) already embeds buffers, but for the demo I'd prefer spread the buffers
	 */
	return {
		verticesBuffer: positionsBuffer,
		textureCoordBuffer: textureCoordBuffer,
		normalsBuffer: normalBuffer,
		indicesBuffer: indicesBuffer,
		mesh: data
	};

}

/**
 * Initialize the buffers for the Cube we'll display
 * @param gl {WebGLRenderingContext}
 * @returns {{position: WebGLBuffer, textureCoord: WebGLBuffer, normal: WebGLBuffer, indices: WebGLBuffer}}
 */
function initCubeBuffers(gl) {

	// Buffer for the cube's vertices positions.
	const positionsBuffer = gl.createBuffer();
	// Buffer to hold indices into the vertex array for each faces's vertices.
	const indicesBuffer = gl.createBuffer();
	// Buffer for normals
	const normalBuffer = gl.createBuffer();
	// Buffer for texture coordinates
	const textureCoordBuffer = gl.createBuffer();


	// Positions
	{
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

		// Bind to the positionsBuffer
		gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
		// Fill the buffer with vertices positions
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	}

	// Texture coordinates
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
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

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
	}

	// Normals
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

		const vertexNormals = [
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

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	}

	// Indices
	{
		// indices of vertices for each face
		const indices = [
			0, 1, 2, 0, 2, 3,         // front
			4, 5, 6, 4, 6, 7,         // back
			8, 9, 10, 8, 10, 11,      // top
			12, 13, 14, 12, 14, 15,   // bottom
			16, 17, 18, 16, 18, 19,   // right
			20, 21, 22, 20, 22, 23,   // left
		];

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	}

	return {
		positions: positionsBuffer,
		textureCoord: textureCoordBuffer,
		normals: normalBuffer,
		indices: indicesBuffer
	};
}

/**
 * Initialize the buffers for the Cube we'll display
 * @param gl {WebGLRenderingContext}
 * @returns {{position: WebGLBuffer, textureCoord: WebGLBuffer, normal: WebGLBuffer, indices: WebGLBuffer}}
 */
function initGridBuffers(gl) {

	// Buffer for the cube's vertices positions.
	const positionsBuffer = gl.createBuffer();
	// Buffer to hold indices into the vertex array for each faces's vertices.
	const indicesBuffer = gl.createBuffer();
	// Buffer for normals
	const normalBuffer = gl.createBuffer();
	// Buffer for colors of each vertex of each face
	const colorsBuffer = gl.createBuffer();
	// Buffer for texture coordinates
	const textureCoordBuffer = gl.createBuffer();


	// Define the position for each vertex of each face
	let positions = [];
	let vertexNormals = [];
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

			vertexNormals[index + 0] = 0.0; // x
			vertexNormals[index + 1] = Math.random();  //1.0; // y
			vertexNormals[index + 2] = 0.0; // z

			colors = colors.concat(c);

			textureCoordinates = textureCoordinates.concat(w / nbW, h / nbH); // u, v


			// Each square of the grid is composed by 2 triangles.
			// Each triangle is composed with 3 vertices. "indices" stores the indices in the "positions" array of these vertices, counter-clock wise.
			if (w < nbW && h < nbH) {
				let i = w + (h * (nbW+1));
				indices = indices.concat(i, i + nbW + 1, i + nbW + 2); // 1st triangle of the square
				indices = indices.concat(i, i + nbW + 2, i + 1); // 2nd triangle of the square
			}
			index += 3;
		}
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return {
		verticesBuffer: positionsBuffer,
		textureCoordBuffer: textureCoordBuffer,
		colorsBuffer: colorsBuffer,
		normalsBuffer: normalBuffer,
		indicesBuffer: indicesBuffer,
		count: indices.length
	};
}

/**
 *
 * @param gl {WebGLRenderingContext}
 * @param url {String}
 * @returns {WebGLTexture}
 */
function loadTexture(gl, url) {
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


let time = 0.0;

/**
 * Render the scene
 * @param gl {WebGLRenderingContext}
 * @param shaderProgramParams {}
 * @param mesh
 */
function drawScene(gl, shaderProgramParams, mesh, texture1, texture2) {

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

	drawMesh(gl, projectionMatrix, shaderProgramParams, mesh, texture1, [0.0, 0.0, -30.0], [0.1, 0, 0]);
	//drawMesh(gl, projectionMatrix, shaderProgramParams, mesh, texture1, [0.0, 0.0, -20.0], [0, -1 * time, 0.5]);
	//drawMesh(gl, projectionMatrix, shaderProgramParams, buffers, texture2, [3, 0.0, -15.0], [0, 1 * time, 0.5 * time]);

	time += 0.01;
}

function drawMesh(gl, projectionMatrix, shaderProgramParams, mesh, texture, translation, rotation) {
	let modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix,     // destination matrix
	               modelViewMatrix,     // matrix to translate
	               translation);        // amount to translate

	//let's rotate the global view
	mat4.rotate(modelViewMatrix,    // destination matrix
	            modelViewMatrix,    // matrix to rotate
	            rotation[0],        // amount to rotate in radians
	            [1, 0, 0]);         // axis to rotate around (X)
	mat4.rotate(modelViewMatrix,    // destination matrix
	            modelViewMatrix,    // matrix to rotate
	            rotation[1],        // amount to rotate in radians
	            [0, 1, 0]);         // axis to rotate around (Y)
	mat4.rotate(modelViewMatrix,    // destination matrix
	            modelViewMatrix,    // matrix to rotate
	            rotation[2],        // amount to rotate in radians
	            [0, 0, 1]);         // axis to rotate around (Z)

	const normalMatrix = mat4.create();
	mat4.invert(normalMatrix, modelViewMatrix);
	mat4.transpose(normalMatrix, normalMatrix);

	// Set the vertexPosition attribute of the shader
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

	//Set the texture coordinates
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureCoordBuffer);
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
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Set the vertexColor attribute of the shader
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

	// Normals
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

	// Let's render
	gl.drawElements(gl.TRIANGLES,
	                mesh.count, //mesh.vertices.length, // count (number of vertices)
	                gl.UNSIGNED_SHORT, // type
	                0 // offset
	);
}


/**
 * Initialize Vertex and Fragment shaders + "linked" program
 * @param gl {WebGLRenderingContext}
 * @param vertexShaderSrcID {String}
 * @param fragmentShaderSrcID {String}
 * @returns {WebGLProgram}
 * */
function initShaderProgram(gl, vertexShaderSrcID, fragmentShaderSrcID) {
	let vertexShaderSource = document.getElementById(vertexShaderSrcID).text;
	let fragmentShaderSource = document.getElementById(fragmentShaderSrcID).text;

	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	return createProgram(gl, vertexShader, fragmentShader);
}

/**
 * Load a "shader" script into a shader object (WebGLShader)
 * @param gl {WebGLRenderingContext}
 * @param type {number} gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param source {String} source code for the shader
 * @returns {WebGLShader}
 */
function createShader(gl, type, source) {
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
 * @param gl {WebGLRenderingContext}
 * @param vertexShader {WebGLShader}
 * @param fragmentShader {WebGLShader}
 * @returns {WebGLProgram}
 */
function createProgram(gl, vertexShader, fragmentShader) {
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


main();

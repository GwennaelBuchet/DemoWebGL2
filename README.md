# DemoWebGL2
Just few tests using WebGL2.

Resources :
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
 * https://github.com/mdn/webgl-examples
 * https://webgl2fundamentals.org
 * https://www.khronos.org/registry/webgl/specs/latest/2.0/


## Demo 1 : Setup
Basic HTML setup, without any  3D computation

## Demo 2 : Basic rendering
Most basics Vertex and Fragment shaders + simple 2D triangle

## Demo 3 : 3D Cube rendering
Let's go to 3D world and display a simple 3D cube

## Demo 4 : Multiple display and animation
Split the DrawScene function to display several time the same cube, with distinct animations

## Demo 5 : Add texture
Apply a simple texture to the cube and modify shaders consequently

## Demo 6 : Add light to the scene
Add light computation in the shaders.
That means we need to define a normal vector for each vertex in order to compute tha light angle.
Also, use separate textures for each cube.

## Demo 7 : load external 3D model file
 
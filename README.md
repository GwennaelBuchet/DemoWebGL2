# DemoWebGL2
Just few tests using WebGL2.

Resources :
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
 * https://github.com/mdn/webgl-examples
 * https://webgl2fundamentals.org
 * https://www.khronos.org/registry/webgl/specs/latest/2.0/
 * https://github.com/frenchtoast747/webgl-obj-loader
 * https://opengameart.org
 * https://learnopengl.com/
 

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
Also, use separate textures for each cube.bj

## Demo 7 : load external 3D model file
Load a .obj model file using the objLoader script.
Websites to download models :
 - https://www.turbosquid.com
 - https://free3d.com/3d-models/obj
 - ...
 
## Demo 8 : all together
Several objects and several materials, with user events

## Demo 9 : Coding the game
Now we get all the base to develop a game, let's do it.
- CubeMapping
- SRT animation
- user interaction
- procedural mesh
- reflection/refraction
- ...
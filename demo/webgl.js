/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#c4");
let offscreen=null
let gl = null
let test_colorLocation=null;
let tDom = document.getElementById("gl-t")

export async function initWebGL(url, ch, cs) {
    const image = new Image();
    await new Promise(resolve => {
        image.onload = resolve;
        image.src = url;
    })
    var vertexShaderSource = `#version 300 es
  
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    in vec2 a_texCoord;
    
    // Used to pass in the resolution of the canvas
    uniform vec2 u_resolution;
    
    // Used to pass the texture coordinates to the fragment shader
    out vec2 v_texCoord;
    
    // all shaders have a main function
    void main() {
    
      // convert the position from pixels to 0.0 to 1.0
      vec2 zeroToOne = a_position / u_resolution;
    
      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;
    
      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;
    
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    
      // pass the texCoord to the fragment shader
      // The GPU will interpolate this value between points.
      v_texCoord = a_texCoord;
    }
    `;

    var fragmentShaderSource = `#version 300 es
    
    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;
    
    // our texture
    uniform sampler2D u_image;
    uniform vec2 test_color;
    // the texCoords passed in from the vertex shader.
    in vec2 v_texCoord;
    
    // we need to declare an output for the fragment shader
    out vec4 outColor;
    float hue2rgb(float p, float q, float t) {
      if (t < 0.0) t += 1.0;
      if (t > 1.0) t -= 1.0;
      if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
      if (t < 1.0 / 2.0) return q;
      if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
      return p;
    }
    vec3 hslToRgb(vec3 hsl) {
      float h = hsl.x;
      float s = hsl.y;
      float l = hsl.z;
      float r, g, b;
    
      if (s == 0.0) {
        r = g = b = l; // achromatic
      } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        
        
    
        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);
      }
    
      return vec3(r, g, b);
    }
    vec3 rgbToHsl(vec3 color) {
      float r = color.r;
      float g = color.g;
      float b = color.b;
      float max = max(r, max(g, b));
      float min = min(r, min(g, b));
      float h, s, l = (max + min) * 0.5;
    
      if (max == min) {
        h = s = 0.0; // achromatic
      } else {
        float d = max - min;
        s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min);
    
        if (max == r) {
          h = (g - b) / d + (g < b ? 6.0 : 0.0);
        } else if (max == g) {
          h = (b - r) / d + 2.0;
        } else if (max == b) {
          h = (r - g) / d + 4.0;
        }
    
        h /= 6.0;
      }
    
      return vec3(h, s, l);
    }
    void main() {
      float ch=test_color[0];
      float cs=test_color[1];
      
      vec3 rawColor = texture(u_image, v_texCoord).rgb;
      vec3 hsl=rgbToHsl(rawColor);
      hsl[0]=ch;
      if(cs>0.1){
        hsl[1]=cs;
      }
      outColor=vec4(hslToRgb(hsl),1.0);
    }
    `;
    /** @type {OffscreenCanvas} */
    offscreen = new OffscreenCanvas(image.width, image.height);
    canvas.width=image.width;
    canvas.height=image.height
    gl = offscreen.getContext("webgl2");
    if (!gl) {
        return;
    }
    var program = webglUtils.createProgramFromSources(gl,
        [vertexShaderSource, fragmentShaderSource]);
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");
    test_colorLocation = gl.getUniformLocation(program, "test_color");
    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var imageLocation = gl.getUniformLocation(program, "u_image");

    // Create a vertex array object (attribute state)
    var vao = gl.createVertexArray();

    // and make it the one we're currently working with
    gl.bindVertexArray(vao);

    // Create a buffer and put a single pixel space rectangle in
    // it (2 triangles)
    var positionBuffer = gl.createBuffer();

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    // provide texture coordinates for the rectangle.
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ]), gl.STATIC_DRAW);

    // Turn on the attribute
    gl.enableVertexAttribArray(texCoordAttributeLocation);

    // Tell the attribute how to get data out of texCoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texCoordAttributeLocation, size, type, normalize, stride, offset);

    // Create a texture.
    var texture = gl.createTexture();

    // make unit 0 the active texture uint
    // (ie, the unit all other texture commands will affect
    gl.activeTexture(gl.TEXTURE0 + 0);

    // Bind it to texture unit 0' 2D bind point
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we don't need mips and so we're not filtering
    // and we don't repeat at the edges
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    var mipLevel = 0;               // the largest mip
    var internalFormat = gl.RGBA;   // format we want in the texture
    var srcFormat = gl.RGBA;        // format of data we are supplying
    var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
    gl.texImage2D(gl.TEXTURE_2D,
        mipLevel,
        internalFormat,
        srcFormat,
        srcType,
        image);

    // webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(test_colorLocation, ch, cs);
    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(imageLocation, 0);

    // Bind the position buffer so gl.bufferData that will be called
    // in setRectangle puts data in the position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set a rectangle the same size as the image.
    setRectangle(gl, 0, 0, image.width, image.height);


    function setRectangle(gl, x, y, width, height) {
        var x1 = x;
        var x2 = x + width;
        var y1 = y;
        var y2 = y + height;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
        ]), gl.STATIC_DRAW);
    }

    // Set a rectangle the same size as the image.
    setRectangle(gl, 0, 0, image.width, image.height);
    webglDraw(ch, cs);

}
export function webglDraw(ch, cs) {
    const st = performance.now();
    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(test_colorLocation, ch, cs);
    gl.drawArrays(primitiveType, offset, count);
    canvas.getContext('2d').drawImage(offscreen, 0, 0, canvas.width, canvas.height)
    const et = performance.now();
    tDom.innerText = parseFloat((et - st).toFixed(3)) + 'ms';
    console.log('webgl', (et - st).toFixed(3) + 'ms');



}
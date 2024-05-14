import { threads } from 'wasm-feature-detect';
function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
};

function rgbToHsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);

  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h, s, l];
};
function hexToRgb(hex) {
  let str = hex.replace("#", "");
  if (str.length % 3) {
    return "hex格式不正确！";
  }
  //获取截取的字符长度
  let count = str.length / 3;
  //根据字符串的长度判断是否需要 进行幂次方
  let power = 6 / str.length;
  let r = parseInt("0x" + str.substring(0 * count, 1 * count)) ** power;
  let g = parseInt("0x" + str.substring(1 * count, 2 * count)) ** power;
  let b = parseInt("0x" + str.substring(2 * count)) ** power;

  return [r, g, b];
}

(async function init() {

  const workerCount = navigator.hardwareConcurrency; // 你想要启动的 Workers 数量

  const workers = [];

  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker('./jsWorker.js');
    workers.push(worker);
  }
  let new_buffer, harmonize_rayon, memory;
  let module;
  let SUPPORT_THREADS = await threads();
  console.log('SUPPORT_THREADS', SUPPORT_THREADS)
  if (SUPPORT_THREADS) {
    module = await import('./pkg-parallel/wasm_bindgen_rayon_demo.js');
    let { memory: mem } = await module.default();
    await module.initThreadPool(navigator.hardwareConcurrency);
    new_buffer = module.new_buffer;
    harmonize_rayon = module.harmonize_rayon
    memory = mem;
  } else {
    module = await import('./pkg/wasm_bindgen_rayon_demo.js');
    let { memory: mem } = await module.default();
    new_buffer = module.new_buffer;
    harmonize_rayon = module.harmonize_rayon
    memory = mem;
  }
  let tip = document.getElementById('wasm-title');
  tip.innerText = SUPPORT_THREADS ? 'wasm multi-thread' : 'wasm multi-thread';

  const img = new Image();
  const img2 = new Image();
  const img3 = new Image();
  const img4 = new Image();
  const wasmt = document.getElementById("wasm-t")
  const jst = document.getElementById("js-t")
  const jsmt = document.getElementById("js-m-t")
  const webglt = document.getElementById("gl-t")
  let ptr = null
  let wasmData = null;
  function wasmDraw(img, r, g, b) {
    const canvas = document.getElementById("c1");
    const w = img.width;
    const h = img.height;
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    let st = performance.now();
    if (!ptr) {
      ptr = new_buffer('test', w * h * 4);
      const imageData = ctx.getImageData(0, 0, w, h);
      wasmData = new Uint8ClampedArray(memory.buffer, ptr, w * h * 4);
      wasmData.set(imageData.data)
    }

    let [ch, cs] = rgbToHsl(r, g, b);
    harmonize_rayon('test', ch, cs);
    ctx.putImageData(new ImageData(wasmData.slice(), w, h), 0, 0)
    let et = performance.now();
    console.log('wasm', Math.floor(et - st) + 'ms')
    wasmt.innerHTML = Math.floor(et - st) + 'ms'
    // remove_buffer('test');
  }
  function jsDraw(img, r, g, b) {
    const canvas = document.getElementById("c2");

    const w = img.width;
    const h = img.height;
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    let st = performance.now();

    const data = imageData.data;

    let [ch, cs] = rgbToHsl(r, g, b);
    for (let i = 0; i < data.length; i += 4) {
      // 将RGB值转换为HSL
      const [cr, cg, cb] = [data[i], data[i + 1], data[i + 2]];
      const hsl = rgbToHsl(cr, cg, cb);

      // 调整HUE值、饱和度
      hsl[0] = ch;
      if (cs > 0.1) hsl[1] = cs; // 避免饱和度过低

      // 将HSL值转换回RGB
      const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
      // 更新图像数据
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];

    }
    ctx.putImageData(imageData, 0, 0)
    let et = performance.now();
    console.log('JS', Math.floor(et - st) + 'ms')
    jst.innerHTML = Math.floor(et - st) + 'ms'
  }
  img.onload = () => {
    wasmDraw(img, 202, 208, 195)
    // jsWorkerDraw(img, 202, 208, 195)
  }
  img2.onload = () => {
    jsDraw(img2, 202, 208, 195)
  }
  img3.onload = () => {
    jsWorkerDraw(img3, 202, 208, 195)
  }
  img4.onload = () => {
    glDraw(img4, 202, 208, 195);
  }
  const url = document.getElementById('origin').src;
  console.log(url)
  img.src = url;
  img2.src = url;
  img3.src = url;
  img4.src = url;
  const input = document.getElementById('color-input');
  [...document.querySelectorAll('input')].filter(i=>i.type==='checkbox').map(checkbox=>{
    const type=checkbox.className;
    window[type]=true
    checkbox.oninput=(v)=>{
      window[type]=v.target.checked
    }
  })
  input.oninput = (e) => {
    const rgb = hexToRgb(e.target.value)
    window._wasm&&wasmDraw(img, ...rgb);
    window._jss&&jsDraw(img2, ...rgb);
    window._jsm&&jsWorkerDraw(img3, ...rgb);
    window._webgl&&glDraw(img4,...rgb);
  }


  function jsWorkerDraw(img, r, g, b) {
    const canvas = document.getElementById("c3");

    const w = img.width;
    const h = img.height;
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data; // ImageData 对象中的像素数组
    let st = performance.now();
    const segmentHeight = Math.ceil(canvas.height / workerCount);

    for (let i = 0; i < workers.length; i++) {
      const offset = i * segmentHeight * canvas.width * 4;
      const length = Math.min(segmentHeight * canvas.width * 4, pixels.length - offset);
      const segment = pixels.slice(offset, offset + length);

      workers[i].postMessage({
        imageData: segment,
        width: canvas.width,
        height: segmentHeight,
        r, g, b,
        offset: offset
      }, [segment.buffer]);
    }
    let completed = 0;
    for (let i = 0; i < workers.length; i++) {
      workers[i].onmessage = function (event) {
        const { imageData, offset } = event.data;
        pixels.set(new Uint8ClampedArray(imageData), offset);
        completed++;
        // 所有 Workers 都完成后，更新 Canvas
        if (completed === workers.length) {
          ctx.putImageData(new ImageData(pixels, w, h), 0, 0);
          let et = performance.now();
          console.log('JS multi worker', Math.floor(et - st) + 'ms')
          jsmt.innerHTML = Math.floor(et - st) + 'ms'
        }
      };
    }
  }

  function glDraw(image, r, g, b) {
    let [ch, cs] = rgbToHsl(r, g, b);

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
    const st = performance.now();
    render(image);
    const et = performance.now();
    webglt.innerText = (et - st).toFixed(3) + 'ms';
    console.log('webgl',(et - st).toFixed(3) + 'ms');
    function render(image) {
      // Get A WebGL context
      if(window._glDraw){
        window._glDraw(ch,cs);
        return 
      }
      /** @type {OffscreenCanvas} */
      var canvas = new OffscreenCanvas(image.width, image.height);
      /** @type {HTMLCanvasElement} */
      const resCanvas = document.querySelector("#c4");
      var gl = canvas.getContext("webgl2");
      if (!gl) {
        return;
      }
      // setup GLSL program
      var program = webglUtils.createProgramFromSources(gl,
        [vertexShaderSource, fragmentShaderSource]);

      // look up where the vertex data needs to go.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
      var texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");
      var test_colorLocation = gl.getUniformLocation(program, "test_color");
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

      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

      // Draw the rectangle.
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count);
      resCanvas.width = image.width;
      resCanvas.height = image.height;
      resCanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height)
      window._glDraw=(ch,cs)=>{
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform2f(test_colorLocation, ch,cs);
        gl.drawArrays(primitiveType, offset, count);
        resCanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height)
      }
    }
   
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

  }
})();

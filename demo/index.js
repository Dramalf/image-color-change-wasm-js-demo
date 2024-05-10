// import { new_buffer, harmonize, remove_buffer, harmonize_rayon } from "./pkg/wasm_bindgen_rayon_demo";
import { threads } from 'wasm-feature-detect';
import { new_buffer, harmonize_rayon } from './pkg-parallel/wasm_bindgen_rayon_demo.js';
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
  let new_buffer,harmonize_rayon,memory;
  let module;
  let SUPPORT_THREADS=await threads();
  if (SUPPORT_THREADS){
    module=await import('./pkg-parallel/wasm_bindgen_rayon_demo.js');
    let {memory:mem}= await module.default();
    await module.initThreadPool(navigator.hardwareConcurrency);
    new_buffer=module.new_buffer;
    harmonize_rayon=module.harmonize_rayon
    memory=mem;
  }else{
    module=await import('./pkg/wasm_bindgen_rayon_demo.js');
    let {memory:mem}= await module.default();
    new_buffer=module.new_buffer;
    harmonize_rayon=module.harmonize_rayon
    memory=mem;
  }
  let tip=document.getElementById('wasm-title');
  tip.innerText=SUPPORT_THREADS?'wasm multi-thread':'wasm multi-thread';

  const img = new Image();
  const img2 = new Image();

  const wasmt = document.getElementById("wasm-t")
  const jst = document.getElementById("js-t")

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
  }
  img2.onload = () => {
    jsDraw(img2, 202, 208, 195)
  }
  img.crossOrigin = "Anonymous";
  img2.crossOrigin = "Anonymous";
  const url=document.getElementById('origin').src;
  console.log(url)
  img.src = url;
  img2.src = url;

  const input = document.getElementById('color-input');
  input.oninput = (e) => {
    const rgb = hexToRgb(e.target.value)
    wasmDraw(img, ...rgb);
    jsDraw(img2, ...rgb);
  }
})();
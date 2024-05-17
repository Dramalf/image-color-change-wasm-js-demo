import { hslToRgb, rgbToHsl } from "./color";

const img=new Image()
const canvas = document.getElementById("c2");
let tDom = document.getElementById("js-t")

export function initJSSingleThread(url,ch,cs){
    img.onload=()=>{
        const w = img.width;
        const h = img.height;
        canvas.width = w
        canvas.height = h
        jsSingleThreadDraw(ch,cs);
    }
    img.src=url;
}
export function jsSingleThreadDraw(ch,cs){
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    let st = performance.now();

    const data = imageData.data;
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
    tDom.innerHTML = Math.floor(et - st) + 'ms'
}
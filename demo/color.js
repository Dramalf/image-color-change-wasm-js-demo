export function hslToRgb(h, s, l) {
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
  
export function rgbToHsl(r, g, b) {
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
export function hexToRgb(hex) {
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
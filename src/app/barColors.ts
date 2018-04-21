//Default color for each alternative
export class barColors {
  static defaultColors = [
  [230,23,23],
  [23,106,230],
  [23,230,106],
  [188,23,230],
  [230,147,23],
  [23,230,230],
  [64,230,23],
  [230,23,147],
  [64,23,230],
  [188,230,23]];

  //Source: https://gist.github.com/mjackson/5311256
  /**
   * Converts an RGB color value to HSV. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and v in the set [0, 1].
   *
   * @param   Number  r       The red color value
   * @param   Number  g       The green color value
   * @param   Number  b       The blue color value
   * @return  Array           The HSV representation
   */
  static rgbToHsv(r:number, g:number, b:number) {
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
      h = 0; // achromatic
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }

      h /= 6;
    }

    return [ h, s, v ];
  }

  /**
   * Converts an HSV color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes h, s, and v are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   Number  h       The hue
   * @param   Number  s       The saturation
   * @param   Number  v       The value
   * @return  Array           The RGB representation
   */
  static hsvToRgb(h:number, s:number, v:number) {
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }

    return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }


  static getHTMLColor(index : number) {
    let color = barColors.defaultColors[index];
    let r = color[0];
    let g = color[1];
    let b = color[2];
    let hsv = barColors.rgbToHsv(r,g,b);
    hsv[1] = 0.05;
    let rgb = barColors.hsvToRgb(hsv[0],hsv[1],hsv[2]);
    r = rgb[0];
    g = rgb[1];
    b = rgb[2];

    return "rgb("+r+","+g+","+b+")";
  }
}

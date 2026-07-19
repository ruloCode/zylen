/** Minimal typings for upng-js (no official @types package). */
declare module 'upng-js' {
  export interface UPNGImage {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    data: ArrayBuffer;
  }

  const UPNG: {
    decode(buffer: ArrayBuffer): UPNGImage;
    toRGBA8(img: UPNGImage): ArrayBuffer[];
    encode(
      imgs: ArrayBuffer[],
      width: number,
      height: number,
      cnum: number,
      dels?: number[]
    ): ArrayBuffer;
  };

  export default UPNG;
}

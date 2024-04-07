export function loadSvg(input: string) {
  /**
   * TODO:
   * - Check valid XML
   * - Check No fabrication size defined in this file
   * - Ensure size is in correct measurement units
   */

    // load from path

    // parse svg to xml object

    // remove all twins (two SVG elements with the same parent, and identical)

    // "Flatten" the SVG by applying all transforms to shapes and paths

    // remove all twins (two SVG elements with the same parent, and identical)

    // return loaded svg
}

/**
 * Notes:
 * - Could create an SVG class and then have pure functions for the operations used after loading
 * E.g. 
 * 
 * const svg = new Svg(input)
 *                  .removeTwins()
 *                  .flatten()
 *                  .removeTwins() // done again maybe...
 * 
 */
// given geometric information computed from a mesh
// write it to the final user
export function displayInfos(geom) {
  var errorMsg = "";

  if (!geom.isValidMesh) {
    errorMsg =
      'This 3D mesh seems to be <strong>not valid for 3D printing</strong>, due to an error in the reconstruction process. Please send the input SVG file to <a href="mailto:contact.activmap@isima.fr">contact.activmap@isima.fr</a>. We will send you back a corrected version of the mesh, and it will help us fix the bug you encountered. A workaround usually consists in adding a small epsilon (e.g. 0.1) to the base buffer, or to tune a bit the accuracy parameters.';
    console.log(errorMsg);
  }

  console.log(
    `This mesh contains ${geom.vertices} vertices and ${geom.faces} faces.`
  );

  const boundingBoxMsg =
    " [" +
    geom.bbox.min.x.toFixed(2) +
    ", " +
    geom.bbox.min.y.toFixed(2) +
    ", " +
    geom.bbox.min.z.toFixed(2) +
    "] [" +
    geom.bbox.max.x.toFixed(2) +
    ", " +
    geom.bbox.max.y.toFixed(2) +
    ", " +
    geom.bbox.max.z.toFixed(2) +
    "].";

  console.log(`Its bounding box is ${boundingBoxMsg}`);
}

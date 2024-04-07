// Removes all children from a three.js group
export function clearGroup(group) {
  for (var i = group.children.length; i >= 0; i--) {
    group.remove(group.children[i]);
  }
}

// Takes an SVG structure, and returns a scene to render as a 3D STL
export function renderObject(vertices, faces, group, camera, options) {
  console.log("Rendering 3D object...");
  // Solid Color
  options.color = new THREE.Color(options.objectColor);
  options.material = options.wantInvertedType
    ? new THREE.MeshLambertMaterial({
        color: options.color,
        emissive: options.color,
      })
    : new THREE.MeshLambertMaterial({
        color: options.color,
        emissive: options.color,
        side: THREE.DoubleSide,
      });

  var geometry = new THREE.Geometry();
  for (var v of vertices) {
    geometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
  }
  for (var f of faces) {
    geometry.faces.push(new THREE.Face3(f.a, f.b, f.c));
  }

  var finalObj = new THREE.Mesh(geometry, options.material);

  var width = getMaximumSize(finalObj);

  // Add the merged geometry to the scene
  group.add(finalObj);

  // change zoom wrt the size of the mesh
  camera.position.set(0, -width, width);
  controls.target.set(0, 0, 0);
  controls.update();

  // Show the wireframe?
  if (options.wantWireFrame) {
    var wireframe = new THREE.WireframeGeometry(finalObj.geometry);
    var lines = new THREE.LineSegments(wireframe);
    lines.material.depthTest = false;
    lines.material.opacity = 0.25;
    lines.material.transparent = true;
    group.add(lines);
  }
  // Show normals?
  if (options.wantNormals) {
    var normals = new THREE.FaceNormalsHelper(finalObj, 2, 0x000000, 1);
    group.add(normals);
  }
  // Show hard edges?
  if (options.wantEdges) {
    var edges = new THREE.EdgesGeometry(finalObj.geometry);
    var lines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    group.add(lines);
  }

  /// add backgroup a background grid
  var helper = new THREE.GridHelper(width * 1.2, 10);
  helper.rotation.x = Math.PI / 2;
  group.add(helper);

  finalObj.geometry.computeBoundingBox();

  return {
    vertices: finalObj.geometry.vertices.length,
    faces: finalObj.geometry.faces.length,
    bbox: finalObj.geometry.boundingBox,
    isValidMesh: SVG3DScene.getNonValidEdges(finalObj.geometry).length == 0,
  };
}

import * as rbush from "../external/rbush.min.js";

import { Box } from "../2d/box.js";

export class SpatialClipping {
  color;
  regions;

  constructor() {
    this.color = null;
    this.regions = new rbush();
  }

  shapes() {
    return this.regions.all().map((x) => x.shape);
  }

  // this function merge the new shape in the existing shapes
  // applying a Martinez union only with shapes that will possibly
  // be intersecting, wrt the RBush tree.
  // The color of the union is defined by the first added element
  // or by the supplementary parameter if required
  add(shape, color = null) {
    var box = Box.fromShape(shape).toRBushItem();
    var possibleShapeBoxes = this.regions.search(box);

    if (possibleShapeBoxes.length > 0) {
      var possibleShapes = possibleShapeBoxes.map((x) => x.shape);

      // compute union
      var union = shape.union(possibleShapes, this.color);

      // remove previous elements
      for (var p of possibleShapeBoxes) {
        this.regions.remove(p);
      }

      // add shapes of the union in the region
      for (var u of union) {
        var ubox = Box.fromShape(u).toRBushItem();
        ubox.shape = u;
        this.regions.insert(ubox);
      }
    } else {
      box.shape = shape;
      this.regions.insert(box);
      this.color = shape.color;
    }
  }

  // add a list of shapes to the current container, set color of the final union
  addList(shapes) {
    for (var s of shapes) this.add(s);
  }

  // this function removes from the given shape the parts contained
  // in the current structure, applying a Martinez diff only with
  // shapes that will possibly be intersecting, wrt the RBush tree
  crop(shape) {
    var box = Box.fromShape(shape).toRBushItem();
    var possibleShapeBoxes = this.regions.search(box);

    if (possibleShapeBoxes.length > 0) {
      var possibleShapes = possibleShapeBoxes.map((x) => x.shape);
      return shape.diff(possibleShapes);
    } else return [shape];
  }

  // crop a list of shapes with the current object
  cropList(shapes) {
    var result = [];
    for (var s of shapes) {
      result = result.concat(this.crop(s));
    }
    return result;
  }
}

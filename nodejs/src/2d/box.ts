/**
 **
 ** class Box: a 2D bounding box
 **
 **
 **/
export class Box {
  left;
  right;
  top;
  bottom;
  valid;

  constructor(left, right, top, bottom, valid = true) {
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.valid = valid;
  }

  toRBushItem = function () {
    return {
      minX: this.left,
      minY: this.top,
      maxX: this.right,
      maxY: this.bottom,
    };
  };

  getMaximumSize = function () {
    var width = this.right - this.left;
    var height = this.bottom - this.top;
    if (width > height) return width;
    else return height;
  };

  add = function (box) {
    if (box.valid) {
      if (box.left < this.left) this.left = box.left;
      if (box.top < this.top) this.top = box.top;
      if (box.right > this.right) this.right = box.right;
      if (box.bottom > this.bottom) this.bottom = box.bottom;
    }
  };

  addPoint = function (point) {
    if (this.valid) {
      if (point[0] < this.left) this.left = point[0];
      if (point[1] < this.top) this.top = point[1];
      if (point[0] > this.right) this.right = point[0];
      if (point[1] > this.bottom) this.bottom = point[1];
    }
  };

  center = function () {
    return [(this.left + this.right) / 2, (this.bottom + this.top) / 2];
  };

  static invalid = function () {
    return new Box(0, 0, 0, 0, false);
  };

  static fromPaths = function (paths) {
    if (paths.length == 0) return this.invalid();

    var result = this.fromPath(paths[0]);

    for (var i = 1; i < paths.length; ++i) {
      result.add(this.fromPath(paths[i]));
    }
    return result;
  };

  static fromShape = function (shape) {
    var result = this.fromPath(shape.polyline);

    if (shape.holes.length > 0) {
      result.add(this.fromPaths(shape.holes));
    }
    return result;
  };

  fromShapes = function (shapes) {
    if (shapes.length == 0) return this.invalid();

    var result = this.fromShape(shapes[0]);

    for (var i = 1; i < shapes.length; ++i) {
      result.add(this.fromShape(shapes[i]));
    }
    return result;
  };

  fromPath = function (path) {
    if (path.length == 0) return this.invalid();
    var result = new Box(path[0][0], path[0][0], path[0][1], path[0][1]);

    for (var i = 1; i != path.length; ++i) {
      result.addPoint(path[i]);
    }
    return result;
  };

  fromXY = function (vertices) {
    if (vertices.length == 0) return this.invalid();
    var result = new Box(
      vertices[0].x,
      vertices[0].x,
      vertices[0].y,
      vertices[0].y
    );

    for (var i = 1; i != vertices.length; ++i) {
      result.addPoint([vertices[i].x, vertices[i].y]);
    }
    return result;
  };
}

import { getElementById, getFillColor, getIDFromURL, getMedianEdgeLength, getStrokeDescription } from "../utils/svg.util";

/*
 * A SVG group is defined by:
 *  * a SVGshape2D or a list of SVGgroup
 *  * a clip-path defined as an SVG group
 *  * a mask defined as an SVG group
 *
 */
export class SVGGroup2D {
  shape;
  content;
  clipPath;
  mask;
  svgColor;

  constructor(elem, root = null, parentStroke = null, forceClip = false) {
    if (root == null) {
      root = elem;
    }

    this.shape = null;
    this.content = null;
    this.clipPath = null;
    this.mask = null;
    this.svgColor = null;

    if (elem && elem.constructor == Object) {
      if (
        elem["children"] &&
        elem["tagName"] &&
        elem["children"].length &&
        (forceClip ||
          (!(elem["tagName"] == "clipPath") && !(elem["tagName"] == "mask")))
      ) {
        this.content = [];
        var strokeDescription = getStrokeDescription(elem);
        if (strokeDescription == null) strokeDescription = parentStroke;

        for (var e = 0; e != elem["children"].length; ++e) {
          var child = null;
          try {
            child = new SVGGroup2D(
              elem["children"][e],
              root,
              strokeDescription
            );
          } catch (e) {
            console.log("Error during shape conversion from SVG. Ignore it.");
            postMessage([
              "warning",
              e.toString() +
                ". Some shapes might not be present in the final mesh.",
            ]);
          }
          if (child != null && !child.empty()) this.content.push(child);
        }
        this.svgColor = getFillColor(elem);
        if (elem["tagName"] == "svg" && this.svgColor == "")
          this.svgColor = "#000000";

        if (this.svgColor != "") {
          for (var c of this.content) {
            c.inheritColor(this.svgColor);
          }
        } else this.svgColor = null;
      } else if (elem["tagName"] && elem["tagName"] == "path") {
        // read SVG path
        var svgPath = elem["attributes"]["d"];

        this.svgColor = getFillColor(elem);

        var stroke = getStrokeDescription(elem);
        if (stroke == null) stroke = parentStroke;

        // Turn SVG path into a three.js shape (that can be composed of a list of shapes)
        var path = d3.transformSVGPath(svgPath);

        // extract shapes associated to the svg path,
        var newShapes = path.toShapes(this.svgWindingIsCW);

        // discretize them, and convert them to a basic list format
        newShapes = SVGGroup2D.convertToList(newShapes);

        var strokeShapes = [];
        if (stroke != null) {
          strokeShapes = SVGGroup2D.getOffsetPaths(newShapes, stroke);
        }

        // handle non closed shapes
        newShapes = SVGGroup2D.selectOnlyLoops(newShapes);

        // possibly split the original path in multiple shapes
        var shapes = TreeNode.splitIntoShapes(newShapes, this.svgColor, false);

        if (stroke != null) {
          strokeShapes = TreeNode.splitIntoShapes(
            strokeShapes,
            stroke["stroke"],
            false
          );
        } else {
          if (strokeShapes.length != 0) {
            console.log("Warning: a stroke without color!");
          }
        }

        if (shapes.length + strokeShapes.length == 0) {
          // empty shape
          return;
        } else if (shapes.length == 1 && strokeShapes.length == 0) {
          this.shape = shapes[0];
        } else if (shapes.length == 0 && strokeShapes.length == 1) {
          this.shape = strokeShapes[0];
        } else {
          this.content = [];
          for (var s of shapes) {
            this.content.push(SVGGroup2D.fromList(s, root));
          }
          for (var s2 of strokeShapes) {
            this.content.push(SVGGroup2D.fromList(s2, root));
          }
        }
      } else {
        console.log("WARNING: svg element not handled - " + elem);
      }

      if (elem["attributes"] && "clip-path" in elem["attributes"]) {
        var id = getIDFromURL(elem["attributes"]["clip-path"]);
        if (id) {
          var newElem = getElementById(root, id);
          this.clipPath = new SVGGroup2D(newElem, root, null, true);
        }
      }
      if (elem["attributes"] && "mask" in elem["attributes"]) {
        var id = getIDFromURL(elem["attributes"]["mask"]);
        if (id) {
          var newElem = getElementById(root, id);
          this.mask = new SVGGroup2D(newElem, root, null, true);
        }
      }
    }
  }

  inheritColor(color) {
    if (!this.svgColor) {
      if (this.shape) {
        if (!this.shape.color || this.shape.color == "") {
          this.shape.color = color;
        }
      } else {
        if (this.content) {
          for (var c of this.content) {
            c.inheritColor(color);
          }
        }
      }
    }
  }

  empty() {
    return this.content == null && this.shape == null;
  }

  applyClipping(clipPath) {
    if (this.shape) {
      // apply intersection
      var res = this.shape.intersection(clipPath);
      if (res.length > 1) {
        // if multiple elements, create a group
        this.content = res;
      } else if (res.length == 1) {
        // otherwise, the shape is the first one
        this.shape = res[0];
      }
      // a clipping can remove all the parts of a shape
      else this.shape = null;
    }
    if (this.content) {
      for (var c of this.content) {
        c = c.applyClipping(clipPath);
      }
    }
  }

  applyClippings() {
    if (this.content != null) {
      // apply first the clippings inside the shape
      for (var c of this.content) {
        c.applyClippings();
      }
    }

    // if the current node has a clipping path, apply it
    if (this.clipPath) {
      // get a flat description of clipPath
      var clipFlat = this.clipPath.getShapesList();
      // apply this clipping path
      this.applyClipping(clipFlat);
      // remove it from the data structure
      this.clipPath = null;
    }
  }

  flatten() {
    // first apply clippings
    this.applyClippings();

    // TODO: handle masks: for each mask:
    //  * apply clipping according to visibility
    //  * only preserve the white shapes
    //  * add these curves to clipping curves
    // Warning: it should be done recursively, since clipping (?) and masks can contain clipping and masks

    // then return shape list
    return this.getShapesList();
  }

  getShapesList() {
    var result = [];

    if (this.shape != null) {
      result.push(this.shape);
    } else {
      if (this.content != null) {
        for (var v = 0; v != this.content.length; ++v) {
          var elems = this.content[v].getShapesList();
          if (elems.length != 0) result = result.concat(elems);
        }
      }
    }

    return result;
  }

  selectOnlyLoops(shapes) {
    result = [];
    for (var sh of shapes) {
      var v = sh.filter(
        (s) =>
          s.length != 0 &&
          !(s[0][0] == s[s.length - 1][0] && s[0][1] == s[s.length - 1][1])
      );
      if (v.length == 0) {
        result.push(sh);
      } else {
        console.log("WARNING: removing a shape with a non loop path");
      }
    }
    return result;
  }

  fromList(shape, root) {
    var result = new SVGGroup2D(null, root);
    result.shape = shape;
    return result;
  }

  toClipperPath(path) {
    var result = path.map(
      (p) => new ClipperLib.IntPoint(p[0] * 100000, p[1] * 100000)
    ); // TODO: correct this conversion float -> int
    if (
      result[0]["X"] == result[result.length - 1]["X"] &&
      result[0]["Y"] == result[result.length - 1]["Y"]
    )
      result.pop();
    return result;
  }

  fromClipperPaths(paths) {
    var result = [];
    for (var path of paths) {
      var cpath = [];
      for (var p of path) {
        cpath.push([p["X"] / 100000, p["Y"] / 100000]);
      }
      // force to be a closed path (polygon)
      if (cpath.length != 0) cpath.push(cpath[0]);

      result.push([cpath]);
    }
    return result;
  }

  getOffsetPaths(shapes, stroke) {
    result = [];

    var miterLimit = 2.0;
    if (stroke["stroke-miterlimit"] != null)
      miterLimit = parseFloat(stroke["stroke-miterlimit"]);

    var delta = 1.0;
    if (stroke["stroke-width"] != null) {
      delta = (parseFloat(stroke["stroke-width"]) / 2) * 100000;
    }
    var roundPrecision = delta / 100; // TODO: find a good value for this

    var joinType = ClipperLib.JoinType.jtMiter; // default value in SVG specification
    if (stroke["stroke-linejoin"] != null) {
      // remark: ClipperLib do not handle all the SVG line joins...
      if (["miter", "miter-clip"].indexOf(stroke["stroke-linejoin"]) > -1)
        joinType = ClipperLib.JoinType.jtMiter;
      if (["round", "arcs"].indexOf(stroke["stroke-linejoin"]) > -1)
        joinType = ClipperLib.JoinType.jtRound;
      if (stroke["stroke-linejoin"] == "bevel")
        joinType = ClipperLib.JoinType.jtSquare;
    }

    var endType = ClipperLib.EndType.etOpenButt; // default value in SVG specification
    if (stroke["stroke-linecap"] != null) {
      if (stroke["stroke-linecap"] == "butt")
        endType = ClipperLib.EndType.etOpenButt;
      if (stroke["stroke-linecap"] == "round")
        endType = ClipperLib.EndType.etOpenRound;
      if (stroke["stroke-linecap"] == "square")
        endType = ClipperLib.EndType.etOpenSquare;
    }

    var clipper = new ClipperLib.ClipperOffset(miterLimit, roundPrecision);

    for (var paths of shapes) {
      for (var path of paths) {
        if (path.length > 1) {
          // if it is a closed path
          var pclip = SVGGroup2D.toClipperPath(path);
          if (
            path[0][0] == path[path.length - 1][0] &&
            path[0][1] == path[path.length - 1][1]
          )
            clipper.AddPath(pclip, joinType, ClipperLib.EndType.etClosedLine);
          // or not
          else clipper.AddPath(pclip, joinType, endType);
        }
      }
    }
    var solution = new ClipperLib.Paths();

    clipper.Execute(solution, delta);

    return SVGGroup2D.fromClipperPaths(solution);
  }

  convertToList(shapes) {
    var result = [];

    var precision = 0;
    if (SVGGroup2D.options && SVGGroup2D.options.precision)
      precision = SVGGroup2D.options.precision;

    var msDistance = 1.0;
    if (SVGGroup2D.options && SVGGroup2D.options.minimalSubdivisionDistance)
      msDistance = SVGGroup2D.options.minimalSubdivisionDistance;
    if (SVGGroup2D.scale) msDistance /= SVGGroup2D.scale;

    for (var j = 0; j < shapes.length; j++) {
      var subdivision = 128;
      var pts;
      var paths;
      var stop = false;
      var prevDist = -1;
      do {
        subdivision /= 2;
        // use an heuristic to adjust the subdivision process
        pts = shapes[j].extractPoints(subdivision);
        paths = [pts.shape].concat(pts.holes);

        dist = getMedianEdgeLength(paths);
        if (subdivision == 1 || prevDist == dist || dist > msDistance)
          stop = true;
        prevDist = dist;
      } while (!stop);

      for (var a = 0; a != paths.length; ++a) {
        for (var b = 0; b != paths[a].length; ++b) {
          if (precision >= 0)
            paths[a][b] = [
              parseFloat(paths[a][b].x.toFixed(precision)),
              parseFloat(paths[a][b].y.toFixed(precision)),
            ];
          else
            paths[a][b] = [
              parseFloat(paths[a][b].x),
              parseFloat(paths[a][b].y),
            ];
        }
      }
      result.push(paths);
    }
    return result;
  }
}

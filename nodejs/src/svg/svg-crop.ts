class SVGCrop {
    svgTXT
    options
    silhouette
    svgWindingIsCW
    viewBox
    precision
    shapes
    svgStructure

    constructor(svgTXT, options, viewBox) {
        this.svgTXT = svgTXT;
        this.options = options;
        this.silhouette = null;
        this.svgWindingIsCW = options.svgWindingIsCW;
        this.viewBox = viewBox;
        this.precision = this.options.discretization ? this.options.precision : -1;
        this.shapes = null;
        this.svgStructure = null;
    }

    addMissingPoints() {
        // add all points in a RBush data structure
        var points = new rbush();

        for (var s of this.shapes) {
            s.addPointsInRBush(points);
        }

        var scale = this.getScale();

        // then add possible missing points
        for (var sh of this.shapes) {
            sh.addMissingPointsFromRBush(points, this.precision, scale);
        }

        for (var si of this.silhouette) {
            si.addMissingPointsFromRBush(points, this.precision, scale);
        }

    }



    getBoundsOfShapes() {
        return Box.fromShapes(this.shapes);
    }


    adjustToPrecision(precision) {
        if (this.shapes != null) {
            for (var s of this.shapes) {
                s.adjustPathsToPrecision(precision);
                s.removeConsecutiveDoubles();
            }
        }
        if (this.silhouette != null) {
            for (var s of this.silhouette) {
                s.adjustPathsToPrecision(precision);
                s.removeConsecutiveDoubles();
            }
        }
    }

    // center and rescale to match the desired width
    rescaleAndCenter(width) {
        var bbox = this.getBoundsOfShapes();
        var ratio = width / (bbox.right - bbox.left);
        var center = bbox.center();
        // rescale and center paths

        for (var sh of this.shapes) {
            sh.rescaleAndCenter(ratio, center);
        }

        for (var si of this.silhouette) {
            si.rescaleAndCenter(ratio, center);
        }
    }

    process() {
        SVGGroup2D.options = this.options;
        SVGGroup2D.scale = this.getScale();


        postMessage(["progress", "buildSVGStructure"]);
        var xml = tXml(this.svgTXT)[0];
        this.svgStructure = new SVGGroup2D(xml);
        // produce a list of shapes (hierarchical structure is only required
        // for mask and clip)
        postMessage(["progress", "applyMasksAndClips"]);
        this.shapes = this.svgStructure.flatten();

        if (this.shapes.length > 0) {
            // adjust the precision wrt the scale
            var precision = this.precision + (Math.floor(getBaseLog(10, this.getScale())));

            this.adjustToPrecision(precision);

            if (this.options.wantBasePlate != null) {
                postMessage(["progress", "addBasePlate"]);
                this.addBasePlateInternal();
            }

            postMessage(["progress", "clipShapesUsingVisibility"]);
            this.clipShapesUsingVisibility();

            postMessage(["progress", "rescaleAndCenter"]);
            // center and scale the shapes
            this.rescaleAndCenter(options.objectWidth - (options.baseBuffer * 2));

            postMessage(["progress", "addMissingPoints"]);
            // add possible missing vertices along the paths
            // when two shapes are sharing a common edge
            this.addMissingPoints();

            postMessage(["progress", "adjustToPrecision"]);
            // adjust to precision before any other step
            this.adjustToPrecision(this.precision);

        }

    }




    getScale() {
        var bbox;
        if (this.options.ignoreDocumentMargins) {
            bbox = this.getBoundsOfShapes();
        }
        else {
            bbox = new Box(this.viewBox[0], this.viewBox[2],
                this.viewBox[1], this.viewBox[3]);
        }

        return this.options.objectWidth / (bbox.right - bbox.left);

    }

    addBasePlateInternal() {
        // compute the effective bounding box, defined or by document margin, or by shapes
        var bbox;
        var plate;

        if (this.options.ignoreDocumentMargins) {
            bbox = this.getBoundsOfShapes();
        }
        else {
            bbox = new Box(this.viewBox[0], this.viewBox[2],
                this.viewBox[1], this.viewBox[3]);
        }

        // add offset if required
        if (this.options.baseBuffer > 0) {
            var buffer = this.options.baseBuffer / this.options.objectWidth * (bbox.right - bbox.left);
            bbox.left -= buffer;
            bbox.top -= buffer;
            bbox.right += buffer;
            bbox.bottom += buffer;
        }

        // create the final shape
        if (this.options.basePlateShape === "Rectangular" ||
            this.options.basePlateShape === "Squared") {
            // first turn it into a square if required
            if (this.options.basePlateShape === "Squared") {
                var width = bbox.right - bbox.left;
                var height = bbox.bottom - bbox.top;
                var middle = [(bbox.left + bbox.right) / 2, (bbox.bottom + bbox.top) / 2];
                var halfSize = (width > height ? width : height) / 2;
                bbox.left = middle[0] - halfSize;
                bbox.right = middle[0] + halfSize;
                bbox.top = middle[1] - halfSize;
                bbox.bottom = middle[1] + halfSize;
            }
            // then create the path
            plate = [[bbox.left, bbox.bottom],
            [bbox.right, bbox.bottom],
            [bbox.right, bbox.top],
            [bbox.left, bbox.top]
            ];

        }
        // Otherwise a circle
        else {
            var middle = bbox.center();
            var corner = [bbox.left, bbox.top];
            var radius = Math.sqrt(distanceSqrd(middle, corner));
            plate = [];
            var nbPoints = 128;
            for (var i = 0; i != nbPoints; i++) {
                plate.push([middle[0] + radius * Math.cos(i / nbPoints * 6.283185307179586),
                middle[1] + radius * Math.sin(i / nbPoints * 6.283185307179586)]);
            }
        }
        // close the shape
        plate.push(plate[0]);

        this.shapes.unshift(new SVGShape2D(plate, "base"));

        // add the depth of the plate
        options.typeDepths["base"] = 0.0;
    }



    clipShapesUsingVisibility() {

        var silhouetteRegion = new SpatialClipping();
        var regions = {};


        if (this.shapes.length > 0) {

            // use inverse order to crop shapes according to their visibility
            for (var i = this.shapes.length - 1; i >= 0; i--) {
                var curShape = this.shapes[i];
                var color = curShape.color;
                var curShapes = [curShape];

                // remove subpart of the regions corresponding to other colors 
                for (var r in regions) {
                    if (r != color) {
                        curShapes = regions[r].cropList(curShapes);
                    }
                }
 
                // then merge the new shape in its region
                if (!(color in regions)) {
                    regions[color] = new SpatialClipping();
                }
                regions[color].addList(curShapes);
 
                // add this shape to the main silhouette
                silhouetteRegion.addList(curShapes);
            }

        }

        this.silhouette = silhouetteRegion.shapes();

        // merge all shapes from regions into a single list
        this.shapes = [];
        for (var r in regions) {
            this.shapes = this.shapes.concat(regions[r].shapes());
        }


    }


    getShapes() {
        if (this.shapes == null)
            this.process();
        return this.shapes;
    }

    getNbShapes() {
        if (this.shapes == null)
            this.process();
        return this.shapes.length;

    }

    getColors() {
        if (this.shapes == null)
            this.process();

        var result = [];
        for (var s of this.shapes) {
            result.push(s.color);
        }
        return result;
    }


    getPalette() {
        if (this.svgColors == null)
            this.process();


            var result = [];
        for (var s of this.shapes) {
            if (s.color != "base")
                result.push(s.color);
        }

        return result;
    }


    getSilhouette() {
        if (this.silhouette == null)
            this.process();
        return this.silhouette;
    }

};

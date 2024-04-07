export function median(values) {
  if (values.length === 0) return 0;

  values.sort(function (a, b) {
    return a - b;
  });

  var half = Math.floor(values.length / 2);

  if (values.length % 2) return values[half];

  return (values[half - 1] + values[half]) / 2.0;
}

export function getEdgeLengthsFromPath(path) {
  var result = [];
  if (path.length <= 1) {
    return result;
  }

  for (var i = 1; i < path.length; ++i) {
    result.push(path[i].distanceTo(path[i - 1]));
  }

  return result;
}

export function getMedianEdgeLength(paths) {
  var lengths = [];
  for (var p of paths) {
    lengths = lengths.concat(getEdgeLengthsFromPath(p));
  }
  return median(lengths);
}

export function getStyleProperties(elem) {
    var regex = /([\w-]*)\s*:\s*([^;]*)/g;
    var match, properties = {};
    while (match = regex.exec(elem["attributes"]["style"])) properties[match[1].trim()] = match[2].trim();
    return properties;
}

export function getFillColor(elem) {
    var properties = getStyleProperties(elem);
    return "fill" in properties ? properties["fill"] : "";
}

export function getStrokeDescription(elem) {
    var properties = getStyleProperties(elem);
    var result = {
        "stroke": null,
        "stroke-width": null,
        "stroke-linecap": null,
        "stroke-linejoin": null,
        "stroke-miterlimit": null
    };

    for (var prop in result) {
        if (prop in elem["attributes"]) result[prop] = elem["attributes"][prop];
        if (prop in properties) result[prop] = properties[prop];
        if (prop == "stroke" && result[prop] != null && result["stroke-width"] == null)
            result["stroke-width"] = 1;

    }
    
    if (result["stroke-width"] != null && result["stroke"] != "none" && parseFloat(result["stroke-width"]) != 0.0)
        return result;
    else
        return null;
}

export function getIDFromURL(url) {
    var expr = new RegExp("[uU][rR][lL][ ]*\\(#[ ]*[\"\']?([A-Za-z][A-Za-z0-9\-\:\.]*)[\"\']?[ ]*\\)");
    var match = expr.exec(url);
    if (match.length == 2)
        return match[1];
    else
        return null;
}

export function getElementById(elem, id) {
    if (!(elem.constructor === Object))
        return null;

    if ("attributes" in elem && "id" in elem["attributes"]) {
        if (elem["attributes"]["id"] == id)
            return elem;
    }

    if ("children" in elem) {
        for (var c of elem["children"]) {
            var r = getElementById(c, id);
            if (r != null)
                return r;
        }
    }

    return null;

}
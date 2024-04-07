import { Worker } from "worker_threads";

import { clearGroup, renderObject } from "../../svg/svg-to-stl";
import { displayInfos } from "../../utils/mesh.util";

// TODO Add progress handler for consumer

export function handleSvgToStlMessages(worker: Worker, group, camera, options) {
  worker.on("message", function (e: { data: any }) {
    if (e.data[0] == "mesh") {
      //   window.progressBar.update(
      //     translation("render3D", "Render 3D object"),
      //     98
      //   );

      clearGroup(group);

      // Render 3D object
      var geom = renderObject(e.data[1], e.data[2], group, camera, options);

      // give info to the user about the mesh
      displayInfos(geom);

      //   clearWaitingProcessing();

      // render button is active
      //   $("#renderButton").prop("disabled", false);
      //   $("#download").prop("disabled", false);
    } else if (e.data[0] == "runMeshProcessing") {
      // TODO pass svg width in!
      options = options || getOpts(674);

      // run next steps
      worker.postMessage(["fullProcessMesh", options, options.typeDepths]);
    } else if (e.data[0] == "SVGColors") {
      //   $("#tableDepths").html(e.data[1]);
    } else if (e.data[0] == "progress") {
      switch (String(e.data[1])) {
        case "buildSVGStructure":
          //   window.progressBar.update(
          //     translation("buildSVGStructure", "Build internal SVG structure"),
          //     12
          //   );
          break;
        case "applyMasksAndClips":
          //   window.progressBar.update(
          //     translation("applyMasksAndClips", "Apply masks and clips"),
          //     15
          //   );
          break;
        case "addBasePlate":
          //   window.progressBar.update(
          //     translation("addBasePlate", "Add base plate"),
          //     20
          //   );
          break;
        case "clipShapesUsingVisibility":
          //   window.progressBar.update(
          //     translation(
          //       "clipShapesUsingVisibility",
          //       "Clip shapes using visibility"
          //     ),
          //     21
          //   );
          break;
        case "rescaleAndCenter":
          //   window.progressBar.update(
          //     translation("rescaleAndCenter", "Rescale and center"),
          //     22
          //   );
          break;
        case "addMissingPoints":
          //   window.progressBar.update(
          //     translation("addMissingPoints", "Add missing points"),
          //     23
          //   );
          break;
        case "adjustToPrecision":
          //   window.progressBar.update(
          //     translation("adjustToPrecision", "Adjust to precision"),
          //     30
          //   );
          break;
        case "shapeToListPath":
          //   window.progressBar.update(
          //     translation("shapeToListPath", "Convert shapes to list of paths"),
          //     50
          //   );
          break;
        case "shapeToListSilhouette":
          //   window.progressBar.update(
          //     translation(
          //       "shapeToListSilhouette",
          //       "Convert silhouette to list of paths"
          //     ),
          //     55
          //   );
          break;
        case "create3Dshape":
          //   window.progressBar.update(
          //     translation("create3Dshape", "Start 3D shapes creation"),
          //     60
          //   );
          break;
        case "mergeSimilarDepth":
          //   window.progressBar.update(
          //     translation("mergeSimilarDepth", "Merge shapes with similar depth"),
          //     65
          //   );
          break;
        case "fillShapes":
          //   window.progressBar.update(
          //     translation("fillShapes", "Fill shapes"),
          //     80
          //   );
          break;
        case "extrudeShapes":
          //   window.progressBar.update(
          //     translation("extrudeShapes", "Extrude shapes"),
          //     85
          //   );
          break;
        case "fineTuning3D":
          //   window.progressBar.update(
          //     translation("fineTuning3D", "Fine tuing of 3D shapes"),
          //     90
          //   );
          break;
      }
    } else if (e.data[0] == "noshapefound") {
      //   $("#svgText").html(
      //     translation("noshapefound", "No shape found in this image.") +
      //       "<br />" +
      //       sizeDefinition
      //   );
      // $("#waitingScreen").removeClass("visible");
      // window.progressBar.stop();
    } else if (e.data[0] == "shapesfound") {
      //   $("#svgText").html(
      //     e.data[1] +
      //       translation("shapesfound", "shapes found in this image.") +
      //       "<br />" +
      //       sizeDefinition
      //   );
    } else if (e.data[0] == "oneshapefound") {
      //   $("#svgText").html(
      //     translation("oneshapefound", "One shape found in this image.") +
      //       "<br />" +
      //       sizeDefinition
      //   );
    } else if (e.data[0] == "warning") {
      //   setWarningMessage(e.data[1]);
    } else if (e.data[0] == "error") {
      //   resetViewer("");
      //   $("#waitingScreen").removeClass("visible");
      //     window.progressBar.stop();
      //   $("#meshText").html(
      //     '<div class="alert alert-danger" role="alert"><strong>' +
      //       translation("errorReconstruction", "Error during reconstruction:") +
      //       "</strong>: " +
      //       e.data[1] +
      //       "</div>"
      //   );
    } else if (e.data[0] == "fullProcessSVG") {
      // processNewSVG(e.data[1], e.data[2], e.data[3], e.data[4]);
    } else if (e.data[0] == "fullProcessMesh") {
      // processSVG2Mesh(e.data[1], e.data[2]);
    } else console.log("Message not handled: ", JSON.stringify(e.data));
  });
}

// TODO Make configurable + ensure we have a good default setup
function getOpts(width: number) {
  // update color depths
  // for (i = 0; i < $("tbody#tableDepths tr").length; i++) {
  //     colorDepths[$("tbody#tableDepths tr#lineDepth" + i + " td span").html().toLowerCase()] = Number($("tbody#tableDepths tr#lineDepth" + i + " td input").val());

  // }
  const colorDepths = [3];

  const defaultOpts = {
    objectWidth: width,
    typeDepths: colorDepths,
    wantInvertedType: false,
    svgWindingIsCW: false,
    wantBasePlate: true,
    basePlateShape: "Rectangle",
    baseDepth: 5,
    baseBuffer: 0,
    wantWireFrame: false,
    wantEdges: true,
    wantNormals: false,
    objectColor: "#007BFF",
    ignoreDocumentMargins: false,
    mergeDistance: 0,
    minimalSubdivisionDistance: 0.1,
    discretization: true,
    precision: 2,
  };

  return defaultOpts;
}

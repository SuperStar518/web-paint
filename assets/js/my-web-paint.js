
////////////////////////////////Global Variables//////////////////////////////
let backImagePath = 'assets/img/image.png';
let myDiagram;
let canvas_width = 100;
let canvas_height = 100;
let current_tool;

const marginHeight = 126 + 80 + 20;
const marginWidth = 50 + 20;
const MAX_SCALE = 1;
const MIN_SCALE = 0.3;
const SCALE_STEP = 0.1;

const TOOL_ARROW = 0;
const TOOL_LINE = 1;
const TOOL_RECT = 2;
const TOOL_TEXT = 3;
const TOOL_FREEHAND = 4;


function init() {
    initColorPicker();
    initGoModule();
}

////////////////////////////////Init Color Picker//////////////////////////////
function initColorPicker() {
    const colorPicker = new ColorPicker.MultiSpectral('#color-picker', {
        color: 'red',
        history: {
            hidden: false,
            colors: ['red', 'yellow', 'orange', 'purple', 'green', 'blue', 'indigo', 'white', 'gray', 'black']
          },
    });
    colorPicker.on('change', function(color) {
        //console.log(colorPickerMultiSpectralCustomAnchor.getColor());
    });
}

////////////////////////////////GOJS Diagram Init//////////////////////////////
function initGoModule() {
    
    $_ = go.GraphObject.make; 
    myDiagram = $_(go.Diagram, 'myDiagram',
    {
        'animationManager.isEnabled': false,
        'undoManager.isEnabled': true,
        allowHorizontalScroll: false, 
        allowVerticalScroll: false,
        maxScale: MAX_SCALE,
        minScale: MIN_SCALE
    });
    // myDiagram.defaultCursor = 'crosshair';
    loadBackgroud();
    initLine();
    initFreehand();
}

function loadBackgroud() {
    
    const img = new Image();
    img.src = backImagePath;

    img.addEventListener('load', function(){
        const scale = Math.max(this.naturalWidth / (window.innerWidth - marginWidth), this.naturalHeight / (window.innerHeight - marginHeight));
        canvas_width = Math.round(this.naturalWidth / scale);
        canvas_height = Math.round(this.naturalHeight / scale);

        let div = myDiagram.div;
        div.style.width = canvas_width + 'px';
        div.style.height = canvas_height + 'px';
        myDiagram.requestUpdate();
        
        myDiagram.add(
            $_(go.Part,  
            { layerName: 'Background',
                selectable: false, pickable: false },
            $_(go.Picture, backImagePath, { width: canvas_width, height: canvas_height, imageStretch: go.GraphObject.Uniform})
        ));
    });

}

function initLine() {
    let tool = new LineDrawingTool();
    tool.archetypeNodeData =
        { stroke: 'black', strokeWidth: 2, category: 'Line' };
    tool.isBackgroundOnly = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(0, tool);
    tool.isEnabled = true;
    
    myDiagram.nodeTemplateMap.add("Line",
        $_(go.Node, 'Spot',
            new go.Binding('zOrder'),
            new go.Binding('layerName', 'isSelected', function(sel) { return sel ? 'Foreground' : ''; }).ofObject(),
            {selectable: true },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            { locationObjectName: "SHAPE", locationSpot: new go.Spot(0, 0, 0.5, 0.5) },
            { resizable: true, resizeObjectName: 'PANEL' },
            new go.Binding("locationSpot", "strokeWidth", function(sw) { return new go.Spot(0, 0, sw / 2, sw / 2); }).ofObject("SHAPE"),
            $_(go.Panel, 'Auto',
                { name: 'PANEL' },
                $_(go.Shape, { name: "SHAPE" },
                    new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(go.Size.stringify),
                    new go.Binding("geometry", "pts", makeGeo).makeTwoWay(saveGeo),
                    new go.Binding('stroke', 'color').makeTwoWay(),
                    new go.Binding('strokeWidth', 'strokeWidth').makeTwoWay()
                )
            )
    ));

    function makeGeo(pts) {
        var geo = new go.Geometry(go.Geometry.Line);
        geo.startX = pts[0];
        geo.startY = pts[1];
        geo.endX = pts[2];
        geo.endY = pts[3];
        return geo;
    }
    function saveGeo(geo) {
        return [geo.startX, geo.startY, geo.endX, geo.endY];
    }
}

function initFreehand() {
     let tool = new FreehandDrawingTool();
     tool.archetypePartData =
         { stroke: 'black', strokeWidth: 2, category: 'FreehandDrawing' };
     tool.isBackgroundOnly = false;
     myDiagram.toolManager.mouseMoveTools.insertAt(1, tool);
     tool.isEnabled = false;
 
     myDiagram.nodeTemplateMap.add('FreehandDrawing',
         $_(go.Node, 'Spot',
             new go.Binding('layerName', 'isSelected', function(sel) { return sel ? 'Foreground' : ''; }).ofObject(),
             new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
             new go.Binding('zOrder'),
             { locationSpot: go.Spot.Center, isLayoutPositioned: false, zOrder: 1  },
             { selectable: true },
             { resizable: true, resizeObjectName: 'PANEL' },
             // the main object is a Panel that surrounds a TextBlock with a Shape
             $_(go.Panel, 'Auto',
                 { name: 'PANEL' },
                 $_(go.Shape,
                 new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(go.Size.stringify),
                 { name: 'SHAPE', fill: null, strokeWidth: 3 },
                 new go.Binding('geometryString', 'geo').makeTwoWay(),
                 new go.Binding('stroke', 'color').makeTwoWay(),
                 new go.Binding('strokeWidth', 'strokeWidth').makeTwoWay())
             
             )
         )
     );
}

function zoomIn() {
    myDiagram.scale += SCALE_STEP;
    let div = myDiagram.div;
    div.style.width = Math.round(canvas_width * myDiagram.scale) + 'px';
    div.style.height = Math.round(canvas_height * myDiagram.scale) + 'px';
    myDiagram.requestUpdate(); // Needed!
}

function zoomOut() {
    myDiagram.scale -= SCALE_STEP;
    let div = myDiagram.div;
    div.style.width = Math.round(canvas_width * myDiagram.scale) + 'px';
    div.style.height = Math.round(canvas_height * myDiagram.scale) + 'px';
    myDiagram.requestUpdate(); // Needed!
}

function undo()
{
	myDiagram.undoManager.undo();
}

function drawFreehand() {
    let tool = myDiagram.toolManager.findTool('FreehandDrawing');
    tool.isEnabled = true;
}

function drawLine() {

}

$(document).ready(function() {
    init();
});
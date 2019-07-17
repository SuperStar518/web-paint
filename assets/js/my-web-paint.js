
////////////////////////////////Global Variables//////////////////////////////
let backImagePath = 'assets/img/image.png';
let myDiagram;
let canvas_width = 100;
let canvas_height = 100;

const marginHeight = 126 + 80 + 20;
const marginWidth = 50 + 20;
const MAX_SCALE = 1;
const MIN_SCALE = 0.3;
const SCALE_STEP = 0.1;

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

    loadBackgroud();
    initFreehand(myDiagram);
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

function initFreehand() {
     let tool = new FreehandDrawingTool();
     tool.archetypePartData =
         { stroke: 'black', strokeWidth: 2, category: 'FreehandDrawing' };
     tool.isBackgroundOnly = false;
     myDiagram.toolManager.mouseMoveTools.insertAt(0, tool);
     tool.isEnabled = true;
 
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
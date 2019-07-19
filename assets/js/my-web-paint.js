
////////////////////////////////Global Variables//////////////////////////////
let backImagePath = 'assets/img/image.png';
let myDiagram;
let canvasWidth = 100;
let canvasHeight = 100;
let currentTool = 0;
let currentColor = 'black';

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
const TOOL_NAMES = ['ArrowDrawing', 'LineDrawing', 'RectDrawing', 'TextDrawing', 'FreehandDrawing'];

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
        currentColor = colorPicker.getColor();
        changeColor();
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
        minScale: MIN_SCALE,
        'draggingTool.dragsLink': true,
        'draggingTool.isGridSnapEnabled': true,
    });
    
    // myDiagram.defaultCursor = 'crosshair';
    loadBackgroud();
    initArrow();
    initLine();
    initRect();
    initText();
    initFreehand();
    initEvent();
}

function initEvent() {
    myDiagram.addDiagramListener('ChangedSelection', () => {
        const selectedNodeCount = myDiagram.selection.count;
        if (selectedNodeCount > 0) {
            const tool = myDiagram.toolManager.findTool(TOOL_NAMES[currentTool]);
            if (tool && tool instanceof go.Tool) {
                tool.isEnabled = false;
            }
        } else {
            const tool = myDiagram.toolManager.findTool(TOOL_NAMES[currentTool]);
            if (tool && tool instanceof go.Tool) {
                tool.isEnabled = true;
            }
        }
    });

    myDiagram.addDiagramListener("Modified", () => {
        if (myDiagram.isModified) {
            $('.return').addClass('active');
        } else {
            $('.return').removeClass('active');
        }
    });

    myDiagram.addDiagramListener("BackgroundSingleClicked", (e) => {
        if (currentTool == TOOL_TEXT) {
            const pt = e.diagram.lastInput.documentPoint;
            const location = pt.x + ' ' + pt.y;
            const nodeData = {zOrder: 1, category: 'TextNode', size:'50 50', loc: location, text_content: 'Type Here...', color: 'red'};
            myDiagram.model.addNodeData(nodeData);
            const part = e.diagram.findPartForData(nodeData);
            if (part) {
                e.diagram.select(part);
                const textBlock = part.findObject('TEXT_BLOCK');
                e.diagram.commandHandler.editTextBlock(textBlock);
            }
        }
    });
    
}

function loadBackgroud() {
    
    const img = new Image();
    img.src = backImagePath;

    img.addEventListener('load', function(){
        const scale = Math.max(this.naturalWidth / (window.innerWidth - marginWidth), this.naturalHeight / (window.innerHeight - marginHeight));
        canvasWidth = Math.round(this.naturalWidth / scale);
        canvasHeight = Math.round(this.naturalHeight / scale);

        let div = myDiagram.div;
        div.style.width = canvasWidth + 'px';
        div.style.height = canvasHeight + 'px';
        myDiagram.requestUpdate();
        
        myDiagram.add(
            $_(go.Part,  
            { layerName: 'Background',
                selectable: false, pickable: false },
            $_(go.Picture, backImagePath, { width: canvasWidth, height: canvasHeight, imageStretch: go.GraphObject.Uniform})
        ));
    });

}

function initArrow() {
    const tool = new ArrowDrawingTool();
    tool.isEnabled = true;
    tool.isBackgroundOnly = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_ARROW, tool);

    myDiagram.linkTemplate = $_(BalloonLink,
        $_(go.Shape,
          { strokeWidth: 3},
          new go.Binding('stroke', 'color'),
          new go.Binding('fill', 'color'),
        )
      );
}

function initLine() {
    let tool = new LineDrawingTool();
    tool.archetypeNodeData =
        { stroke: 'black', strokeWidth: 2, category: TOOL_NAMES[TOOL_LINE] };
    tool.isBackgroundOnly = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_LINE, tool);
    tool.isEnabled = false;
    
    myDiagram.nodeTemplateMap.add(TOOL_NAMES[TOOL_LINE],
        $_(go.Node, 'Spot',
            new go.Binding('zOrder'),
            new go.Binding('layerName', 'isSelected', function(sel) { return sel ? 'Foreground' : ''; }).ofObject(),
            {selectable: true },
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            { locationObjectName: 'SHAPE', locationSpot: new go.Spot(0, 0, 0.5, 0.5) },
            { resizable: true, resizeObjectName: 'PANEL' },
            new go.Binding('locationSpot', 'strokeWidth', function(sw) { return new go.Spot(0, 0, sw / 2, sw / 2); }).ofObject('SHAPE'),
            $_(go.Panel, 'Auto',
                { name: 'PANEL' },
                $_(go.Shape, { name: 'SHAPE' },
                    new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(go.Size.stringify),
                    new go.Binding('geometry', 'pts', (pts) => {
                        var geo = new go.Geometry(go.Geometry.Line);
                        geo.startX = pts[0];
                        geo.startY = pts[1];
                        geo.endX = pts[2];
                        geo.endY = pts[3];
                        return geo;
                    }).makeTwoWay( (geo) => {
                        return [geo.startX, geo.startY, geo.endX, geo.endY];
                    } ),
                    new go.Binding('stroke', 'color').makeTwoWay(),
                    new go.Binding('strokeWidth', 'strokeWidth').makeTwoWay()
                )
            )
    ));
}

function initRect() {
    let tool = new RectDrawingTool();
    tool.archetypeNodeData =
        { stroke: 'black', strokeWidth: 2, category: TOOL_NAMES[TOOL_RECT] };
    tool.isBackgroundOnly = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_RECT, tool);
    tool.isEnabled = false;
    
    myDiagram.nodeTemplateMap.add(TOOL_NAMES[TOOL_RECT],
        $_(go.Node, 'Spot',
            new go.Binding('zOrder'),
            new go.Binding('layerName', 'isSelected', function(sel) { return sel ? 'Foreground' : ''; }).ofObject(),
            {selectable: true },
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            { locationObjectName: 'SHAPE', locationSpot: new go.Spot(0, 0, 0.5, 0.5) },
            { resizable: true, resizeObjectName: 'PANEL' },
            new go.Binding('locationSpot', 'strokeWidth', function(sw) { return new go.Spot(0, 0, sw / 2, sw / 2); }).ofObject('SHAPE'),
            $_(go.Panel, 'Auto',
                { name: 'PANEL' },
                $_(go.Shape, 
                    { name: 'SHAPE', strokeCap: "round" },
                    new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(go.Size.stringify),
                    new go.Binding('geometry', 'pts', (pts) => {
                        var geo = new go.Geometry(go.Geometry.Rectangle);
                        geo.startX = pts[0];
                        geo.startY = pts[1];
                        geo.endX = pts[2];
                        geo.endY = pts[3];
                        return geo;
                    }).makeTwoWay((geo) => {
                        return [geo.startX, geo.startY, geo.endX, geo.endY];
                    }),
                    new go.Binding('stroke', 'color').makeTwoWay(),
                    new go.Binding('strokeWidth', 'strokeWidth').makeTwoWay(),
                    new go.Binding('fill', '', (data) => {
                        return data.isFill ? data.color : 'transparent';
                    })
                )
            )
    ));
}

function initFreehand() {
     let tool = new FreehandDrawingTool();
     tool.archetypePartData =
         { stroke: 'black', strokeWidth: 2, category: TOOL_NAMES[TOOL_FREEHAND] };
     tool.isBackgroundOnly = false;
     myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_FREEHAND, tool);
     tool.isEnabled = false;
 
     myDiagram.nodeTemplateMap.add(TOOL_NAMES[TOOL_FREEHAND],
         $_(go.Node, 'Spot',
             new go.Binding('layerName', 'isSelected', function(sel) { return sel ? 'Foreground' : ''; }).ofObject(),
             new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
             new go.Binding('zOrder'),
             { locationSpot: go.Spot.Center, zOrder: 1  },
             { selectable: true, resizable: true, resizeObjectName: 'PANEL' },
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

function initText() {
    myDiagram.nodeTemplateMap.add("TextNode",
        $_(go.Node, 
            new go.Binding("layerName", "isSelected", function(sel) { return sel ? "Foreground" : ""; }).ofObject(),
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding("zOrder"),
            { locationSpot: go.Spot.Center },
            $_(go.Panel, 'Auto',
                {name: 'TEXT_PANEL'},
                $_(go.Shape,
                    {fill: null, strokeWidth: 2, stroke: null},
                    new go.Binding('stroke', 'isSelected', (isSelected) => {
                        return isSelected ? 'blue' : 'transparent';
                    })),
                $_(go.TextBlock, 
                    {name: 'TEXT_BLOCK', margin: 10},
                    new go.Binding("angle").makeTwoWay(),
                    { editable: true, isMultiline: true},
                    new go.Binding('stroke', 'color').makeTwoWay(),
                    new go.Binding('text', 'text_content').makeTwoWay())
            )
        )
    );
}

function zoomIn() {
    myDiagram.scale += SCALE_STEP;
    let div = myDiagram.div;
    div.style.width = Math.round(canvasWidth * myDiagram.scale) + 'px';
    div.style.height = Math.round(canvasHeight * myDiagram.scale) + 'px';
    myDiagram.requestUpdate(); // Needed!
}

function zoomOut() {
    myDiagram.scale -= SCALE_STEP;
    let div = myDiagram.div;
    div.style.width = Math.round(canvasWidth * myDiagram.scale) + 'px';
    div.style.height = Math.round(canvasHeight * myDiagram.scale) + 'px';
    myDiagram.requestUpdate(); // Needed!
}

function undo()
{
	myDiagram.undoManager.undo();
}

function updateDrawMode() {
    let i = 0;
    let tool;
    for (i = 0 ; i < 5 ; i ++) {
        tool = myDiagram.toolManager.findTool(TOOL_NAMES[i]);
        if (tool && tool instanceof go.Tool) {
            if (i == currentTool) {
                tool.isEnabled = true;
            } else {
                tool.isEnabled = false;
            }
        }
    }
}

function drawArrow() {
    currentTool = TOOL_ARROW;
    updateDrawMode();
}

function drawLine() {
    currentTool = TOOL_LINE;
    updateDrawMode();
}

function drawRect() {
    currentTool = TOOL_RECT;
    updateDrawMode();
}

function drawFreehand() {
    currentTool = TOOL_FREEHAND;
    updateDrawMode();
}

function drawText() {
    currentTool = TOOL_TEXT;
    updateDrawMode();
}

function changeColor() {
    myDiagram.selection.each(function (part) {
        myDiagram.model.setDataProperty(part.data, "color", currentColor);
    });
}

$(document).ready(function() {
    init();
});
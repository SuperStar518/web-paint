
////////////////////////////////Global Variables//////////////////////////////
let backImagePath = 'assets/img/image.png';
let myDiagram;
let canvasWidth = 100;
let canvasHeight = 100;
let currentTool = 0;
let currentColor = 'red';
let lineWidth = 5;
let maxZOrder = 1;
let minZOrder = 1;
let fontChanged = false;
let selectedNode;
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
const MENU_IDS = ['arrowMenu', 'lineMenu', 'rectMenu', 'textMenu', 'pencilMenu'];
const FONT_FAMLIY=['Open sans', 'Impact', 'Verdana', 'Yu Gothic Medium'];
function init() {
    initColorPicker();
    initGoModule();
    initLineWidthModule();
}

/////////////Init Line Width change Module//////////////////////
function initLineWidthModule() {
    $('#pencilMenu').popover({
        // trigger: 'focus',
        html: true,
        placement: 'bottom',
        title: '',
        content: function () {
            return $('#lineWidthDiv').html();
        }
    });
    $('html').on('click', function(e) {
        if (!$(e.target).parents().is('#pencilMenu') &&
           !$(e.target).parents().is('.popover-body')) {
          $('#pencilMenu').popover('hide');
        }
        if (!$(e.target).parents().is('#myDiagram')) {
            myDiagram.clearSelection();
        }
    });
}

function changeLineWidth(val) {
    lineWidth = Number(val);
    const tool = myDiagram.toolManager.findTool(TOOL_NAMES[currentTool]);
    if (tool && tool instanceof FreehandDrawingTool) {
        tool.changeWidth();
    }

}

function hideLineWidthPopover() {
    $('#pencilMenu').popover('hide');
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

function hideColorPicker() {
    $('.colorpicker').removeClass('is-opened');
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
        'relinkingTool.isUnconnectedLinkValid': true,
    });
    
    // myDiagram.defaultCursor = 'crosshair';
    loadBackgroud();
    initArrow();
    initLine();
    initRect();
    initText();
    initFreehand();
    initEvent();
    // initContextMenu();

    $('#myDiagram canvas').mousedown(() => {
        hideColorPicker();
        hideContextMenu();
    });
}

// function initContextMenu() {
//     const cxElement = document.getElementById('contextMenu');
//     const myContextMenu = $_(go.HTMLInfo, {
//         show: showContextMenu,
//         mainElement: cxElement
//     });
//     myDiagram.contextMenu = myContextMenu;
//     cxElement.addEventListener('contextmenu', function(e) {
//         e.preventDefault();
//         return true;
//     }, false);
// }

function showContextMenu(obj, diagram, tool) {
    if (!obj) {
        return;
    }
    const cxElement = document.getElementById('contextMenu');
    cxElement.style.display = 'block';
    // Show only the relevant buttons given the current state.
    var cmd = diagram.commandHandler;
    document.getElementById('btn_del').style.display = 'block';
    document.getElementById('btn_up').style.display = 'block';
    document.getElementById('btn_down').style.display = 'block';
    document.getElementById('btn_bucket').style.display = obj.data.category === TOOL_NAMES[TOOL_RECT] ? 'block' : 'none';
    document.getElementById('btn_txt_large').style.display = obj.data.category === TOOL_NAMES[TOOL_TEXT] ? 'block' : 'none';
    document.getElementById('btn_txt_small').style.display = obj.data.category === TOOL_NAMES[TOOL_TEXT] ? 'block' : 'none';
    document.getElementById('btn_font_select').style.display = obj.data.category === TOOL_NAMES[TOOL_TEXT] ? 'block' : 'none';

    // we don't bother overriding positionContextMenu, we just do it here:
    cxElement.style.left = (obj.location.x - 30) + 'px';
    cxElement.style.top = obj.location.y + 'px';
}

function hideContextMenu() {
    const cxElement = document.getElementById('contextMenu');
    cxElement.style.display = 'none';
}

function cxcommand(event, val) {
    if (val === undefined) val = event.currentTarget.id;
    const currNode = myDiagram.selection.first();
    myDiagram.toolManager.textEditingTool.doCancel();
    switch (val) {
        case 'btn_del':
            myDiagram.commandHandler.deleteSelection();
            hideContextMenu();
            break;
        case 'btn_up': 
            maxZOrder++;
            myDiagram.model.setDataProperty(currNode.data, 'zOrder', maxZOrder);
            hideContextMenu();
            break;
        case 'btn_down':
            myDiagram.nodes.each(function(n) {
                if (n !== currNode) {
                    myDiagram.model.setDataProperty(n.data, 'zOrder', n.data.zOrder+1);
                }
            });
            myDiagram.links.each(function(n) {
                if(n !== currNode) {
                    myDiagram.model.setDataProperty(n.data, 'zOrder', n.data.zOrder+1);
                }
            });
            maxZOrder++;
            myDiagram.model.setDataProperty(currNode.data, 'zOrder', 1);
            hideContextMenu();
            break;
        case 'btn_bucket':
            if (currNode.data.isFill) {
                myDiagram.model.setDataProperty(currNode.data, 'isFill', false);
            } else {
                myDiagram.model.setDataProperty(currNode.data, 'isFill', true);
            }
            break;
        case 'btn_txt_large':
            myDiagram.model.setDataProperty(currNode.data, 'fontSize', currNode.data.fontSize + 5);
            fontChanged = true;
            selectedNode = currNode;
            break;
        case 'btn_txt_small':
            myDiagram.model.setDataProperty(currNode.data, 'fontSize', Math.max(currNode.data.fontSize - 5, 5));
            selectedNode = currNode;
            fontChanged = true;
            break;
        case 'btn_font_select':
            myDiagram.model.setDataProperty(currNode.data, 'fontFamily', event.target.value);
            selectedNode = currNode;
            fontChanged = true;
            break;
    }
}

function initEvent() {
    myDiagram.addDiagramListener('ChangedSelection', () => {
        const selectedNodeCount = myDiagram.selection.count;

        //enable / disable drawing tool
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

        //show / hide context menu
        if (selectedNodeCount == 1) {
            const selectedNode = myDiagram.selection.first();
            showContextMenu(selectedNode, myDiagram);
        } else if (fontChanged) {
            fontChanged = false;
            myDiagram.select(selectedNode);
        } else {
            hideContextMenu();
        }

        //enable move mode
        myDiagram.nodes.each((n) => {
            if (n.data) {
                myDiagram.model.setDataProperty(n.data, 'isSelected', false);
            }
        });
        myDiagram.selection.each((n) => {
            if (n.data) {
                myDiagram.model.setDataProperty(n.data, 'isSelected', true);
            }
        })
    });

    myDiagram.addDiagramListener('Modified', () => {
        if (myDiagram.isModified) {
            $('.return').addClass('active');
            $('.save').addClass('active');
        } else {
            $('.return').removeClass('active');
            $('.save').removeClass('active');
        }
    });

    myDiagram.addDiagramListener('BackgroundSingleClicked', (e) => {
        if (currentTool == TOOL_TEXT) {
            const pt = e.diagram.lastInput.documentPoint;
            const location = pt.x + ' ' + pt.y;
            maxZOrder++;
            const nodeData = {zOrder: maxZOrder, category: TOOL_NAMES[TOOL_TEXT], size:'100 50', loc: location, text_content: ' ', color: currentColor, fontSize: 20, fontFamily: 'Open sans'};
            myDiagram.model.addNodeData(nodeData);
            const part = e.diagram.findPartForData(nodeData);
            if (part) {
                e.diagram.select(part);
            }
        } else {
            hideContextMenu();
        }
    });

    myDiagram.addDiagramListener('LayoutCompleted', (e) => {
        const part = e.diagram.selection.first();
        if (part && part.data.category === TOOL_NAMES[TOOL_TEXT]) {
            const textBlock = part.findObject('TEXT_BLOCK');
            myDiagram.commandHandler.editTextBlock(textBlock);
        }
    });
    
    myDiagram.addDiagramListener('LinkDrawn', (e) => {
      myDiagram.clearSelection();
    });

    myDiagram.addDiagramListener('SelectionMoved', (e) => {
        if ( myDiagram.selection.count === 1) {
            const selectedNode = myDiagram.selection.first();
            showContextMenu(selectedNode, myDiagram);
        }
    })
}

function loadBackgroud() {
    
    const img = new Image();
    img.src = backImagePath;

    img.addEventListener('load', function(){
        const scale = Math.max(this.naturalWidth / Math.min((window.innerWidth - marginWidth), this.naturalWidth), 
                                this.naturalHeight / Math.min((window.innerHeight - marginHeight), this.naturalHeight));
        canvasWidth = Math.round(this.naturalWidth / scale) + 10;
        canvasHeight = Math.round(this.naturalHeight / scale) + 10;

        let div = myDiagram.div;
        div.style.width = canvasWidth + 'px';
        div.style.height = canvasHeight + 'px';
        myDiagram.requestUpdate();
        
        // const canvasElement = $('#myDiagram canvas');
        // const ctx = canvas.getContext("2d");
        // ctx.drawImage(img, 0, 0);
        myDiagram.add(
            $_(go.Part,
            { layerName: 'Background', selectable: false, pickable: false, },
            $_(go.Picture, backImagePath, { width: canvasWidth - 10, height: canvasHeight - 10, imageStretch: go.GraphObject.Uniform})
        ));
    });

}

function initArrow() {
    const tool = new ArrowDrawingTool();
    tool.isEnabled = true;
    tool.isBackgroundOnly = false;
    tool.archetypeLinkData = { strokeWidth: 2};
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_ARROW, tool);

    myDiagram.linkTemplate = 
        $_(BalloonLink,
            { selectable: true},
            new go.Binding('zOrder'),
            $_(go.Shape, { isPanelMain: true, strokeWidth: 2 },
                new go.Binding('stroke', 'color'),
                new go.Binding('fill', 'color')
            ),
            { selectionAdornmentTemplate:
                $_(go.Adornment,
                    $_(go.Shape,
                        { isPanelMain: true, stroke: 'rgba(30, 144, 255, 0.3)', strokeWidth: 10 },
                        new go.Binding('fill', 'color'))
                )
            }
        );
}

function initLine() {
    let tool = new LineDrawingTool();
    tool.archetypeNodeData =
        { zOrder: 1, category: TOOL_NAMES[TOOL_LINE] };
    tool.isBackgroundOnly = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_LINE, tool);
    tool.isEnabled = false;
    
    myDiagram.nodeTemplateMap.add(TOOL_NAMES[TOOL_LINE],
        $_(go.Node, 'Spot',
            new go.Binding('zOrder'),
            {selectable: true },
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            { locationObjectName: 'SHAPE', locationSpot: new go.Spot(0, 0, 0.5, 0.5) },
            { resizable: true, resizeObjectName: 'PANEL' },
            new go.Binding('locationSpot', 'strokeWidth', function(sw) { return new go.Spot(0, 0, sw / 2, sw / 2); }).ofObject('SHAPE'),
            $_(go.Panel, 'Auto',
                { name: 'PANEL' },
                $_(go.Shape, 'Rectangle',
                    { fill: 'transparent', stroke: 'transparent'},
                    new go.Binding('visible', 'isSelected', (isSelected) => {
                        return isSelected ? true : false;
                    })
                ),
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
        { zOrder: 1, stroke: currentColor, fill: currentColor, strokeWidth: 2, category: TOOL_NAMES[TOOL_RECT] };
    tool.isBackgroundOnly = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_RECT, tool);
    tool.isEnabled = false;
    
    myDiagram.nodeTemplateMap.add(TOOL_NAMES[TOOL_RECT],
        $_(go.Node, 'Spot',
            new go.Binding('zOrder'),
            {selectable: true },
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            { locationObjectName: 'SHAPE', locationSpot: new go.Spot(0, 0, 0.5, 0.5) },
            { resizable: true, resizeObjectName: 'PANEL' },
            new go.Binding('locationSpot', 'strokeWidth', function(sw) { return new go.Spot(0, 0, sw / 2, sw / 2); }).ofObject('SHAPE'),
            $_(go.Panel, 'Auto',
                { name: 'PANEL' },
                $_(go.Shape, 
                    { name: 'SHAPE', strokeCap: 'round' },
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
         { isSelected: false, zOrder: 1, stroke: 'black', category: TOOL_NAMES[TOOL_FREEHAND] };
     tool.isBackgroundOnly = false;
     myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_FREEHAND, tool);
     tool.isEnabled = false;
 
     myDiagram.nodeTemplateMap.add(TOOL_NAMES[TOOL_FREEHAND],
         $_(go.Node, 'Spot',
             new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
             new go.Binding('zOrder'),
             { selectable: true, resizable: true, resizeObjectName: 'PANEL' },
             // the main object is a Panel that surrounds a TextBlock with a Shape
             $_(go.Panel, 'Auto',
                 { name: 'PANEL' },
                 $_(go.Shape, 'Rectangle',
                     { fill: 'transparent', stroke: 'transparent'},
                     new go.Binding('visible', 'isSelected', (isSelected) => {
                         return isSelected ? true : false;
                     })
                 ),
                 $_(go.Shape,
                    new go.Binding('desiredSize', 'size', go.Size.parse).makeTwoWay(go.Size.stringify),
                    { name: 'SHAPE', fill: null, strokeWidth: lineWidth },
                    new go.Binding('stroke', 'color').makeTwoWay(),
                    new go.Binding('strokeWidth', 'strokeWidth').makeTwoWay())
             )
         )
     );
}

function initText() {
    myDiagram.nodeTemplateMap.add(TOOL_NAMES[TOOL_TEXT],
        $_(go.Node, 
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding('zOrder'),
            $_(go.Panel, 'Auto',
                {name: 'TEXT_PANEL', padding: 2},
                $_(go.Shape,
                    {fill: null, strokeWidth: 2, stroke: null},
                    new go.Binding('stroke', 'isSelected', (isSelected) => {
                        return isSelected ? 'blue' : 'transparent';
                    })),
                $_(go.TextBlock, 
                    {name: 'TEXT_BLOCK'},
                    new go.Binding('angle').makeTwoWay(),
                    { editable: true, isMultiline: true},
                    new go.Binding('stroke', 'color').makeTwoWay(),
                    new go.Binding('text', 'text_content').makeTwoWay(),
                    new go.Binding('font', '', (data) => {
                        return data.fontSize + 'px ' + data.fontFamily;
                    }))
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

function save() {
    const img = myDiagram.makeImageData({
        scale: 1,
        type: "image/png"
    });
    download(img, 'Gyazo.png', 'image/png');
}

function cancel() {
    if (!myDiagram.isModified) {
        document.location.href = 'index.html';
        return;
    }
    if (window.confirm("Discard the changes?")) { 
        document.location.href = 'index.html'
    }
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
        $('#' + MENU_IDS[i]).removeClass('active');
    }
    $('#'+MENU_IDS[currentTool]).addClass('active');
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
    myDiagram.startTransaction();
    myDiagram.selection.each(function (part) {
        myDiagram.model.setDataProperty(part.data, 'color', currentColor);
    });
    myDiagram.commitTransaction();

    let i = 0;
    let tool;
    for (i = 0 ; i < 5 ; i ++) {
        tool = myDiagram.toolManager.findTool(TOOL_NAMES[i]);
        if (tool && tool instanceof go.Tool && !(tool instanceof go.LinkingTool)) {
            tool.changeColor();
        }
    }
    $('#color-picker').css('background-color', currentColor);
}

$(document).ready(function() {
    init();
});
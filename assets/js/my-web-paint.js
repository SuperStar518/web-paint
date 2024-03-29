
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
let isTextEditStarting = false;

const marginHeight = 126 + 80 + 20;
const marginWidth = 50 + 20;
const MAX_SCALE = 2;
const MIN_SCALE = 0.3;

const TOOL_ARROW = 0;
const TOOL_LINE = 1;
const TOOL_RECT = 2;
const TOOL_TEXT = 3;
const TOOL_FREEHAND = 4;
const TOOL_NAMES = ['ArrowDrawing', 'LineDrawing', 'RectDrawing', 'TextDrawing', 'FreehandDrawing'];
const MENU_IDS = ['arrowMenu', 'lineMenu', 'rectMenu', 'textMenu', 'pencilMenu'];

function init() {
    initColorPicker();
    initGoModule();
    initLineWidthModule();
    drawArrow();
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
        const parents = $(e.target).parents();
        //hide pencil popover element
        if (!parents.is('#pencilMenu') &&
           !parents.is('.popover-body')) {
          $('#pencilMenu').popover('hide');
        }
        //clear selection when click elements besides context menu and color select
        if (!parents.is('#myDiagram') && !parents.is('#contextMenu') && !parents.is('.colorpicker')) {
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
        zoomPoint: new go.Point(0,0)
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

//control context menu
function showContextMenu(obj) {
    if (!obj) {
        return;
    }
    const cxElement = document.getElementById('contextMenu');
    cxElement.style.display = 'block';

    document.getElementById('btn_del').style.display = 'block';
    document.getElementById('btn_up').style.display = 'block';
    document.getElementById('btn_down').style.display = 'block';
    document.getElementById('btn_bucket').style.display = obj.data.category === TOOL_NAMES[TOOL_RECT] ? 'block' : 'none';
    document.getElementById('btn_txt_large').style.display = obj.data.category === TOOL_NAMES[TOOL_TEXT] ? 'block' : 'none';
    document.getElementById('btn_txt_small').style.display = obj.data.category === TOOL_NAMES[TOOL_TEXT] ? 'block' : 'none';
    document.getElementById('btn_font_select').style.display = obj.data.category === TOOL_NAMES[TOOL_TEXT] ? 'block' : 'none';
    cxElement.style.left = (obj.location.x * myDiagram.scale - 30) + 'px';
    cxElement.style.top = obj.location.y * myDiagram.scale + 'px';
}

function hideContextMenu() {
    const cxElement = document.getElementById('contextMenu');
    cxElement.style.display = 'none';
    $('textarea.goTXarea').css('z-index', 0);
    $('#myDiagram canvas').focus();
}

function cxcommand(event, val) {
    if (val === undefined) val = event.currentTarget.id;
    const currNode = myDiagram.selection.first();
    myDiagram.toolManager.textEditingTool.acceptText(go.TextEditingTool.Tab);
    switch (val) {
        case 'btn_del':
            myDiagram.commandHandler.deleteSelection();
            myDiagram.clearSelection();
            hideContextMenu();
            break;
        case 'btn_up': 
            maxZOrder++;
            myDiagram.model.setDataProperty(currNode.data, 'zOrder', maxZOrder);
            myDiagram.clearSelection();
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
            myDiagram.clearSelection();
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
            break;
        case 'btn_txt_small':
            myDiagram.model.setDataProperty(currNode.data, 'fontSize', Math.max(currNode.data.fontSize - 5, 5));
            break;
        case 'btn_font_select':
            myDiagram.model.setDataProperty(currNode.data, 'fontFamily', event.target.value);
            break;
    }
}

/////////////////////////////////////////////////
//Init Gojs Diagram event
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
            showContextMenu(selectedNode);
        }  else {
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
        const currNode = e.diagram.selection.first();
        
        if (currentTool === TOOL_TEXT && (!currNode)) {
            const pt = e.diagram.lastInput.documentPoint;
            const location = pt.x + ' ' + pt.y;
            maxZOrder++;
            const nodeData = {zOrder: maxZOrder, category: TOOL_NAMES[TOOL_TEXT], size:'100 50', loc: location, text_content: '', color: currentColor, fontSize: 20, fontFamily: 'Open sans'};
            myDiagram.model.addNodeData(nodeData);
            const part = e.diagram.findPartForData(nodeData);
            if (part) {
                e.diagram.select(part);
            }
            isTextEditStarting = true;
        } else {
            myDiagram.clearSelection();
        }
    });

    myDiagram.addDiagramListener('LayoutCompleted', (e) => {
        const part = e.diagram.selection.first();
        if (part && part.data.category === TOOL_NAMES[TOOL_TEXT]) {
            if (isTextEditStarting){
                const textBlock = part.findObject('TEXT_BLOCK');
                myDiagram.commandHandler.editTextBlock(textBlock);
                isTextEditStarting = false;
                $('.goTXarea').on('keyup', () => {
                    const part = myDiagram.selection.first();
                    myDiagram.model.setDataProperty(part.data, 'text_content', $('textarea.goTXarea').val());
                })
            }
        }
    });
    
    myDiagram.addDiagramListener('LinkDrawn', (e) => {
      myDiagram.clearSelection();
    });

    myDiagram.addDiagramListener('SelectionMoved', (e) => {
        if ( myDiagram.selection.count === 1) {
            const selectedNode = myDiagram.selection.first();
            showContextMenu(selectedNode);
        }
    });

    $('#myDiagram canvas').mousedown(() => {
        hideColorPicker();
        if (myDiagram.selection.count == 1) {
            const part = myDiagram.selection.first();
            if (part.data.category === TOOL_NAMES[TOOL_TEXT] && part.data.text_content === '') {
                myDiagram.commandHandler.deleteSelection();
            }
        } else {
            hideContextMenu();
        }
    });
}

function mouseEnterEventProc() {
    const tool = myDiagram.toolManager.findTool(TOOL_NAMES[currentTool]);
    if (tool && tool instanceof go.Tool) {
        tool.isEnabled = false;
    }
}

function mouseLeaveEventProc(e, node) {
    if (node.isSelected) {
        return;
    }
    const tool = myDiagram.toolManager.findTool(TOOL_NAMES[currentTool]);
    if (tool && tool instanceof go.Tool) {
        tool.isEnabled = true;
    }
}

///////////////////////////////////////////////////
//Init Gojs Diagram componenets
function loadBackgroud() {
    
    const img = new Image();
    img.src = backImagePath;

    img.addEventListener('load', function(){
        const scale = Math.max(this.naturalWidth / Math.min((window.innerWidth - marginWidth), this.naturalWidth), 
                                this.naturalHeight / Math.min((window.innerHeight - marginHeight), this.naturalHeight));
        canvasWidth = Math.round(this.naturalWidth / scale) - 2;
        canvasHeight = Math.round(this.naturalHeight / scale) - 2;

        let div = myDiagram.div;
        div.style.width = canvasWidth + 'px';
        div.style.height = canvasHeight + 'px';
        myDiagram.requestUpdate();
        myDiagram.fixedBounds = new go.Rect(0, 0, canvasWidth, canvasHeight);
        myDiagram.add(
            $_(go.Part,
                { name:'backImage', layerName: 'Background', selectable: false, pickable: false, position: new go.Point(-5,-5)},
                $_(go.Picture, backImagePath, { width: canvasWidth+6, height: canvasHeight+6})
        ));
    });

}

function initArrow() {
    const tool = new ArrowDrawingTool();
    tool.isBackgroundOnly = false;
    tool.isEnabled = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_ARROW, tool);

    myDiagram.linkTemplateMap.add(TOOL_NAMES[TOOL_ARROW], 
        $_(ArrowLink, 
            { selectable: true, relinkableFrom: true, relinkableTo: true },
            new go.Binding('zOrder'),
            $_(go.Shape, { isPanelMain: true, strokeWidth: 3 },
                new go.Binding('stroke', 'color'),
                new go.Binding('fill', 'color')
            ),
            { selectionAdornmentTemplate:
                $_(go.Adornment,
                    $_(go.Shape,
                        { isPanelMain: true, stroke: 'rgba(30, 144, 255, 0.3)', strokeWidth: 10, fill: 'rgba(0, 0, 0, 0)' })
                )
            },
            {
                mouseEnter: mouseEnterEventProc,
                mouseLeave: mouseLeaveEventProc
            }
    ));

}

function initLine() {
    const tool = new LineDrawingTool();
    tool.isBackgroundOnly = false;
    tool.isEnabled = false;
    myDiagram.toolManager.mouseMoveTools.insertAt(TOOL_LINE, tool);

    
    myDiagram.linkTemplateMap.add(TOOL_NAMES[TOOL_LINE],
        $_(go.Link, 
            { selectable: true, relinkableFrom: true, relinkableTo: true },
            new go.Binding('zOrder'),
            $_(go.Shape, { isPanelMain: true, strokeWidth: 4 },
                new go.Binding('stroke', 'color'),
                new go.Binding('fill', 'color')
            ),
            { selectionAdornmentTemplate:
                $_(go.Adornment,
                    $_(go.Shape,
                        { isPanelMain: true, stroke: 'rgba(30, 144, 255, 0.3)', strokeWidth: 6 })
                )
            },
            {
                mouseEnter: mouseEnterEventProc,
                mouseLeave: mouseLeaveEventProc
            }
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
            ),
            {
                mouseEnter: mouseEnterEventProc,
                mouseLeave: mouseLeaveEventProc
            }
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
             ),
             {
                 mouseEnter: mouseEnterEventProc,
                 mouseLeave: mouseLeaveEventProc
             }
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
                $_(go.TextBlock, 
                    {name: 'TEXT_BLOCK'},
                    new go.Binding('angle').makeTwoWay(),
                    { editable: true, isMultiline: true},
                    new go.Binding('stroke', 'color').makeTwoWay(),
                    new go.Binding('text', 'text_content').makeTwoWay(),
                    new go.Binding('font', '', (data) => {
                        return data.fontSize + 'px ' + data.fontFamily;
                    }))
            ),
            {
                mouseEnter: mouseEnterEventProc,
                mouseLeave: mouseLeaveEventProc
            }
        )
    );
}

////////////////////////////Top Tool Bar Actoins////////////////////////////////
function zoomIn() {
    if (myDiagram.commandHandler.canIncreaseZoom()) {
        myDiagram.commandHandler.increaseZoom();
        let div = myDiagram.div;
        div.style.width = Math.round(canvasWidth * myDiagram.scale) + 'px';
        div.style.height = Math.round(canvasHeight * myDiagram.scale) + 'px';
        myDiagram.requestUpdate();
    }
}

function zoomOut() {
    if (myDiagram.commandHandler.canDecreaseZoom()) {
        myDiagram.commandHandler.decreaseZoom();
        let div = myDiagram.div;
        div.style.width = Math.round(canvasWidth * myDiagram.scale) + 'px';
        div.style.height = Math.round(canvasHeight * myDiagram.scale) + 'px';
        myDiagram.requestUpdate();
    }
}

function undo()
{
    if (!myDiagram.isModified || !$('.return').hasClass('active')) {
        return;
    }
	myDiagram.undoManager.undo();
}

function save() {
    if (!myDiagram.isModified || !$('.save').hasClass('active')) {
        return;
    }
    myDiagram.toolManager.textEditingTool.acceptText(go.TextEditingTool.Tab);
    myDiagram.clearSelection();
    myDiagram.isModified = false;
    const img = myDiagram.makeImageData({
        scale: 1,
        type: "image/png"
    });
    download(img, 'Gyazo.png', 'image/png');

    $('.return').removeClass('active');
    $('.save').removeClass('active');

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

    if (currentTool === TOOL_ARROW || currentTool === TOOL_LINE) {
        tool = myDiagram.toolManager.linkingTool;
        myDiagram.model.setCategoryForLinkData(tool.archetypeLinkData, TOOL_NAMES[currentTool]);
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
    myDiagram.startTransaction();
    myDiagram.selection.each(function (part) {
        myDiagram.model.setDataProperty(part.data, 'color', currentColor);
    });
    myDiagram.commitTransaction();

    let i = 0;
    let tool;
    for (i = 0 ; i < 5 ; i ++) {
        tool = myDiagram.toolManager.findTool(TOOL_NAMES[i]);
        if (tool && tool instanceof go.Tool) {
            tool.changeColor();
        }
    }
    $('#color-picker').css('background-color', currentColor);
}

//////////////////////////////INIT ALL/////////////////////////////////////////
$(document).ready(function() {
    init();
});
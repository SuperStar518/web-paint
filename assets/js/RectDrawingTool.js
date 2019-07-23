"use strict";

function RectDrawingTool() {
    go.Tool.call(this);
    this.name = "RectDrawing";

    /** @type {Object} */
    this._archetypeNodeData = {};
    this.createTemp();
}

go.Diagram.inherit(RectDrawingTool, go.Tool);


  RectDrawingTool.prototype.createTemp = function() {
    var b = new go.Part();
    b.layerName = "Tool";
    b.selectable = false;
    b.locationObjectName = "SHAPE";
    var r = new go.Shape();
    r.name = "SHAPE";
    r.geometry = new go.Geometry(go.Geometry.Rectangle);
    r.fill = null;
    r.strokeWidth = 2;
    r.stroke = currentColor;
    r.position = new go.Point(0, 0);
    b.add(r);
    b.locationSpot = new go.Spot(0, 0, r.strokeWidth/2, r.strokeWidth/2);
    /** @type {Part} */
    this._tempLine = b;
  }

  RectDrawingTool.prototype.changeColor = function() {
    this.createTemp();
  }
  /**
  * This tool can run when there has been a mouse-drag, far enough away not to be a click,
  * and there has been delay of at least {@link #delay} milliseconds
  * after the mouse-down before a mouse-move.
  * <p/>
  * This method may be overridden.
  * @this {RectDrawingTool}
  * @return {boolean}
  */
  RectDrawingTool.prototype.canStart = function() {
    if (!this.isEnabled) return false;

    // gotta have some node data that can be copied
    if (this.archetypeNodeData === null) return false;

    var diagram = this.diagram;
    if (diagram === null) return false;
    // heed IsReadOnly & AllowInsert
    if (diagram.isReadOnly || diagram.isModelReadOnly) return false;
    if (!diagram.allowInsert) return false;

    var e = diagram.lastInput;
    // require left button & that it has moved far enough away from the mouse down point, so it isn't a click
    if (!e.left) return false;
    // don't include the following checks when this tool is running modally
    if (diagram.currentTool !== this) {
      if (!this.isBeyondDragSize()) return false;
      // must wait for "delay" milliseconds before that tool can run
      if (e.timestamp - diagram.firstInput.timestamp < this.delay) return false;
    }
    return true;
  };

  /**
  * Capture the mouse and show the {@link #tempLine}.
  * @this {RectDrawingTool}
  */
  RectDrawingTool.prototype.doActivate = function() {
    var diagram = this.diagram;
    if (diagram === null) return;
    this.isActive = true;
    diagram.isMouseCaptured = true;
    // this.createTemp();
    diagram.add(this.tempLine);
    this.doMouseMove();
  };

  /**
  * Release the mouse and remove any {@link #tempLine}.
  * @this {RectDrawingTool}
  */
  RectDrawingTool.prototype.doDeactivate = function() {
    var diagram = this.diagram;
    if (diagram === null) return;
    diagram.remove(this.tempLine);
    diagram.isMouseCaptured = false;
    this.isActive = false;
  };

  /**
  * Update the {@link #tempLine}'s two end points.
  * @this {RectDrawingTool}
  */
  RectDrawingTool.prototype.doMouseMove = function() {
    var diagram = this.diagram;
    if (diagram === null) return;
    if (this.isActive && this.tempLine !== null) {
      RectDrawingTool.updateLineGeometry(diagram.firstInput.documentPoint, diagram.lastInput.documentPoint, this.tempLine);
    }
  };

  /**
  * Call {@link #insertPart}
  * @this {RectDrawingTool}
  */
  RectDrawingTool.prototype.doMouseUp = function() {
    if (this.isActive) {
      var diagram = this.diagram;
      diagram.remove(this.tempLine);
      try {
        diagram.currentCursor = "wait";
        this.insertPart(diagram.firstInput.documentPoint, diagram.lastInput.documentPoint);
      } finally {
        diagram.currentCursor = "";
      }
    }
    this.stopTool();
  };

  /**
  * Create a node by adding a copy of the {@link #archetypeNodeData} object
  * to the diagram's model, assign its {@link GraphObject#position} and {@link GraphObject#desiredSize}
  * according to the given bounds, and select the new part.
  * <p>
  * The actual part that is added to the diagram may be a {@link Part}, a {@link Node},
  * or even a {@link Group}, depending on the properties of the {@link #archetypeNodeData}
  * and the type of the template that is copied to create the part.
  * @this {RectDrawingTool}
  * @param {Point} start
  * @param {Point} end
  * @return {Part} the newly created Part, or null if it failed.
  */
  RectDrawingTool.prototype.insertPart = function(start, end) {
    var diagram = this.diagram;
    if (diagram === null) return null;
    var arch = this.archetypeNodeData;
    if (arch === null) return null;

    this.startTransaction(this.name);
    var part = null;
    if (arch !== null) {
      var data = diagram.model.copyNodeData(arch);
      if (data) {
        data.color = currentColor;
        maxZOrder++;
        data.zOrder = maxZOrder;
        diagram.model.addNodeData(data);
        part = diagram.findPartForData(data);
      }
    }
    if (part !== null) {
      RectDrawingTool.updateLineGeometry(diagram.firstInput.documentPoint, diagram.lastInput.documentPoint, part);
      // if (diagram.allowSelect) {
      //   diagram.select(part);  // raises ChangingSelection/Finished
      // }
    }

    // set the TransactionResult before raising event, in case it changes the result or cancels the tool
    this.transactionResult = this.name;
    this.stopTransaction();
    return part;
  };

  /**
  * Gets or sets the {@link Part} used as the line Shape
  * that is stretched to follow the mouse, as feedback for what points will
  * be passed to {@link #insertPart} upon a mouse-up.
  * <p/>
  * Initially this is a {@link Part} containing only a simple magenta rectangular {@link Shape}.
  * The object to be resized should be named "SHAPE".
  * Setting this property does not raise any events.
  * <p/>
  * Modifying this property while this tool {@link Tool#isActive} might have no effect.
  * @name RectDrawingTool#tempLine
  * @function.
  * @return {Part}
  */
  Object.defineProperty(RectDrawingTool.prototype, "tempLine", {
    get: function() { return this._tempLine; },
    set: function(val) { this._tempLine = val; }
  });

  /**
  * Gets or sets the time in milliseconds for which the mouse must be stationary
  * before this tool can be started.
  * The default value is 175 milliseconds.
  * A value of zero will allow this tool to run without any wait after the mouse down.
  * Setting this property does not raise any events.
  * @name RectDrawingTool#delay
  * @function.
  * @return {number}
  */
  Object.defineProperty(RectDrawingTool.prototype, "delay", {
    get: function() { return this._delay; },
    set: function(val) { this._delay = val; }
  });

  /**
  * Gets or sets a data object that will be copied and added to the diagram's model each time this tool executes.
  * The default value is null.
  * The value must be non-null for this tool to be able to run.
  * Setting this property does not raise any events.
  * @name RectDrawingTool#archetypeNodeData
  * @function.
  * @return {Object}
  */
  Object.defineProperty(RectDrawingTool.prototype, "archetypeNodeData", {
    get: function() { return this._archetypeNodeData; },
    set: function(val) { this._archetypeNodeData = val; }
  });


  /**
  * This static function updates the geometry of the main Shape in the given Part and set the part's location.
  * This depends on the structure of both the tempLine and the part template.
  * This is used by both RectDrawingTool and LineReshapingTool.
  * @param {Point} start
  * @param {Point} end
  * @param {Part} part
  */
  RectDrawingTool.updateLineGeometry = function(start, end, part) {
    var shape = part.findObject("SHAPE");
    if (shape === null) shape = part.findMainElement();
    var x = Math.min(start.x, end.x);
    var y = Math.min(start.y, end.y);
    var geo = new go.Geometry(go.Geometry.Rectangle);
    geo.startX = start.x - x;
    geo.startY = start.y - y;
    geo.endX = end.x - x;
    geo.endY = end.y - y;
    shape.geometry = geo;
    shape.part.location = new go.Point(x, y);
  }
  // end RectDrawingTool
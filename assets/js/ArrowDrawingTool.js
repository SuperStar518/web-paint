function ArrowDrawingTool() {
    go.LinkingTool.call(this);
    this.name = "ArrowDrawing";
    this.isUnconnectedLinkValid = true;
    this._fakeStartPort = null;
  }
  go.Diagram.inherit(ArrowDrawingTool, go.LinkingTool);

  ArrowDrawingTool.prototype.canStart = function() {
    if (!this.isEnabled) return false;
    var diagram = this.diagram;
    if (diagram === null || diagram.isReadOnly || diagram.isModelReadOnly) return false;
    if (!diagram.allowLink) return false;
    var model = diagram.model;
    if (!(model instanceof go.GraphLinksModel) && !(model instanceof go.TreeModel)) return false;
    // require left button & that it has moved far enough away from the mouse down point, so it isn't a click
    if (!diagram.lastInput.left) return false;
    // don't include the following check when this tool is running modally
    if (diagram.currentTool !== this) {
      if (!this.isBeyondDragSize()) return false;
    }
    var port = this.findLinkablePort();
    if (port === null) {
      var $ = go.GraphObject.make;
      this._fakeStartPort = this.startObject =
        $(go.Shape, { width: 1, height: 1, portId: "", fromLinkable: true });
      var node =
        $(go.Node,
          { layerName: "Tool", locationSpot: go.Spot.Center, location: diagram.firstInput.documentPoint },
          this.startObject);
      diagram.add(node);
      node.ensureBounds();
    }
    return true;
  };

  ArrowDrawingTool.prototype.insertLink = function(fromnode, fromport, tonode, toport) {
    if (this._fakeStartPort !== null) {
      fromnode = fromport = null;
    }
    var link = go.LinkingTool.prototype.insertLink.call(this, fromnode, fromport, tonode, toport);
    if (link !== null) link.defaultFromPoint = this.diagram.firstInput.documentPoint.copy();
    return link;
  };

  ArrowDrawingTool.prototype.doStop = function() {
    if (this._fakeStartPort !== null) {
      this.diagram.remove(this._fakeStartPort.part);
      this._fakeStartPort = null;
    }
    go.LinkingTool.prototype.doStop.call(this);
  };
  // end of ArrowDrawingTool
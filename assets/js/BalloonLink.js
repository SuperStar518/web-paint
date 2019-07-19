"use strict";
/*
*  Copyright (C) 1998-2019 by Northwoods Software Corporation. All Rights Reserved.
*/

// A custom Link that draws a "balloon" shape around the Link.fromNode

/**
* @constructor
* @extends Link
* @class
* This custom Link class customizes its Shape to surround the comment node.
* If the Shape is filled, it will obscure the comment itself unless the Link is behind the comment node.
* Thus the default layer for BalloonLinks is "Background".
*/
function BalloonLink() {
  go.Link.call(this);
  this.layerName = "Background";
  this._base = 10;
}
go.Diagram.inherit(BalloonLink, go.Link);

/**
* @ignore
* Copies properties to a cloned BalloonLink.
* @this {BalloonLink}
* @param {BalloonLink} copy
* @override
*/
BalloonLink.prototype.cloneProtected = function(copy) {
  go.Link.prototype.cloneProtected.call(this, copy);
  copy._base = this._base;
}

/*
* The width of the base of the triangle at the center point of the Link.fromNode.
* The default value is 10.
* @name BalloonLink#base
* @function.
* @return {number}
*/
Object.defineProperty(BalloonLink.prototype, "base", {
  get: function() { return this._base; },
  set: function(value) { this._base = value; }
});

/**
* Produce a Geometry from the Link's route that draws a "balloon" shape around the Link.fromNode
* and has a triangular shape with the base at the fromNode and the top at the toNode.
* @this {BalloonLink}
*/
BalloonLink.prototype.makeGeometry = function() {
  const startPt = this.getPoint(0);
  const endPt = this.getPoint(1);
  
  const alpha = Math.atan2(startPt.y - endPt.y, endPt.x - startPt.x);
  const theta = Math.atan2(3, 10);
  let beta = Math.atan2(8, 15);

  const r = Math.min(Math.sqrt(100 + 9), Math.sqrt((startPt.x - endPt.x)*(startPt.x - endPt.x) + (startPt.y - endPt.y) * (startPt.y - endPt.y)) / 10);
  const r1 = Math.min(Math.sqrt(225 + 64), Math.sqrt((startPt.x - endPt.x)*(startPt.x - endPt.x) + (startPt.y - endPt.y) * (startPt.y - endPt.y)) / 2);

  if (r1 < Math.sqrt(225+64)) {
    beta = Math.atan2(4, 10);
  }

  var fig = new go.PathFigure(startPt.x, startPt.y, true);
  fig.add(new go.PathSegment(go.PathSegment.Line, endPt.x - r * Math.cos(alpha + theta), endPt.y + r * Math.sin(alpha + theta)));
  fig.add(new go.PathSegment(go.PathSegment.Line, endPt.x - r1 * Math.cos(alpha + beta), endPt.y + r1 * Math.sin(alpha + beta)));
  fig.add(new go.PathSegment(go.PathSegment.Line, endPt.x, endPt.y));
  fig.add(new go.PathSegment(go.PathSegment.Line, endPt.x - r1 * Math.cos(alpha - beta), endPt.y + r1 * Math.sin(alpha - beta)));
  fig.add(new go.PathSegment(go.PathSegment.Line, endPt.x - r * Math.cos(alpha - theta), endPt.y + r * Math.sin(alpha - theta)));
  fig.add(new go.PathSegment(go.PathSegment.Line, startPt.x, startPt.y));
  var geo = new go.Geometry();
  geo.add(fig);
  geo.normalize();
  return geo;
};
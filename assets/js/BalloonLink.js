"use strict";

function BalloonLink() {
  go.Link.call(this);
  this.layerName = "Background";
}
go.Diagram.inherit(BalloonLink, go.Link);

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
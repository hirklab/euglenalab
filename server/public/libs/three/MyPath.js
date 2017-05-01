MyPath=function(properties) {
  var me=this;
  
  this.pointProperties={
    index:properties.index, type:properties.type, size:properties.size, 
    color:properties.color, highlightColor:properties.highlightColor, doHighlight:true,
  }; 
  
  this.name=properties.name;
  this.id=properties.id;
  this.rawPoints=properties.points;
  this.points=[];
  this.isVisible=true;
  return this;
};
MyPath.prototype=Object.create(Object.prototype);
MyPath.prototype.addPoint=function(point) {
  var me=this;
  point.z=2;
  me.pointProperties.point=point; 
  var newPoint=new MyPoint(me.pointProperties);
  newPoint.name=''+me.points.length;
  me.points.push(newPoint);
  return newPoint;
};
MyPath.prototype.toggleVisible=function(toggleOn) {
  this.isVisible=toggleOn;
  for(var i=0;i<this.points.length;i++) {
    this.points[i].toggleVisible(toggleOn);
  } 
};
MyPath.prototype.toggleHighlight=function(toggleOn) {
  for(var i=0;i<this.points.length;i++) {
    this.points[i].toggleHighlight(toggleOn);
  } 
};
MyPath.prototype.setHighlightPoint=function(imageFrameNumber) {
  this.toggleHighlight(false);
  for(var j=0;j<this.points.length;j++) {
    if(this.points[j].frameNumber===imageFrameNumber) {
      this.points[j].toggleHighlight(true);
      break;
    }
  }
};

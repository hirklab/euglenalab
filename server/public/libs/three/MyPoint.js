MyPoint=function(properties) {
  THREE.Line.call(this);
  var me=this;
  function xPoint(center, size, color) {
    var geometry = new THREE.Geometry();
    geometry.vertices= [
      new THREE.Vector3(size, size, 0), new THREE.Vector3(-size, -size, 0),
      new THREE.Vector3(0, 0, center.z), new THREE.Vector3(size, -size, 0),
      new THREE.Vector3(-size, size, 0)
    ];
    material=new THREE.LineBasicMaterial({color:color, opacity:0.5, linewidth:2} );
    me.geometry=geometry;
    me.material=material;
    me.position.x=center.x;
    me.position.y=center.y;
    me.position.z=center.z;
  };
  function vPoint(center, size, color) {
    var geometry = new THREE.Geometry();
    geometry.vertices= [
      new THREE.Vector3(size, 0, 0), new THREE.Vector3(-size, 0, 0),
    ];
    material=new THREE.LineBasicMaterial({color:color, opacity:0.5, linewidth:2} );
    me.geometry=geometry;
    me.material=material;
    me.position.x=center.x;
    me.position.y=center.y;
    me.position.z=center.z;
  };
  function dPoint(center, size, color) {
    var geometry = new THREE.Geometry();
    geometry.vertices= [
      new THREE.Vector3(0, size, 0), new THREE.Vector3(0, -size, 0),
    ];
    material=new THREE.LineBasicMaterial({color:color, opacity:0.5, linewidth:2} );
    me.geometry=geometry;
    me.material=material;
    me.position.x=center.x;
    me.position.y=center.y;
    me.position.z=center.z;
  };
  function bPoint(center, size, color) {
    var geometry = new THREE.Geometry();
    geometry.vertices= [
      new THREE.Vector3(size, size, 0), new THREE.Vector3(size, -size, 0),
      new THREE.Vector3(-size, -size, 0), new THREE.Vector3(-size, size, 0),
      new THREE.Vector3(size, size, 0),
    ];
    material=new THREE.LineBasicMaterial({color:color, opacity:0.5, linewidth:4, transparent:true} );
    me.geometry=geometry;
    me.material=material;
    me.position.x=center.x;
    me.position.y=center.y;
    me.position.z=center.z;
  };
  if(properties.type==='x') {
    xPoint(properties.point, properties.size, properties.color);
  } else if(properties.type==='v') {
    vPoint(properties.point, properties.size, properties.color);
  } else if(properties.type==='d') {
    dPoint(properties.point, properties.size, properties.color);
  } else if(properties.type==='b') {
    bPoint(properties.point, properties.size, properties.color);
  }

  if(properties.doHighlight) { 
    var highlightProperties={
      type:'b', point:{x:0, y:0, z:0}, size:properties.size*2, color:properties.highlightColor,
      pathIndex:properties.path, doHighlight:false,
    }; 
    this.highlightBox=new MyPoint(highlightProperties);
    this.highlightBox.name='highlightBox';
    this.highlightBox.visible=false;
    this.add(this.highlightBox);  
  }
 
  this.frameNumber=properties.point.frameNumber; 
  return this;
};
MyPoint.prototype=Object.create(THREE.Line.prototype);
MyPoint.prototype.setPosition=function(position) {
  this.position.x=position.x;
  this.position.y=position.y;
  this.position.z=position.z;
};
MyPoint.prototype.setColor=function(color) {this.material.color=color;};
MyPoint.prototype.setOpacity=function(opacity) {this.material.opacity=opacity;};
MyPoint.prototype.toggleHighlight=function(toggleOn) {
  if(this.highlightBox) {this.highlightBox.visible=toggleOn;}
};
MyPoint.prototype.toggleVisible=function(toggleOn) {
  if(!toggleOn) {this.toggleHighlight(false);}
  this.visible=toggleOn;
};

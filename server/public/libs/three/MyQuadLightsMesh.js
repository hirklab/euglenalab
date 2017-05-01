MyQuadLightsMesh=function(properties) {
  THREE.Mesh.call(this);
 
  var _me=this;
  _me.properties=properties;
  _me.name=properties.name;

  var verts=[]; 
  var faces=[]; 

  _me.leftLight=null; 
  _me.rightLight=null; 
  _me.topLight=null; 
  _me.bottomLight=null;

  function getBasicLight(name, verts, faces, color, opacity, isTransparent) {
    var geometry = new THREE.Geometry();
    geometry.vertices=verts
    geometry.faces=faces;
    var light=new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:color, opacity:opacity, transparent:isTransparent}));
    light.name=name;
    return light;
  };
 
  function triangleLights() {
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500-_me.properties.offsets.x, 0, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(-_me.properties.lightSize.width-_me.properties.parentSize.width*0.500-_me.properties.offsets.x, _me.properties.parentSize.height*0.500, _me.properties.offsets.z))
    verts.push(new THREE.Vector3(-_me.properties.lightSize.width-_me.properties.parentSize.width*0.500-_me.properties.offsets.x, -_me.properties.parentSize.height*0.500, _me.properties.offsets.z))
    faces.push(new THREE.Face3(0, 1, 2));
    _me.leftLight=getBasicLight('leftLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500+_me.properties.offsets.x, 0, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(_me.properties.lightSize.width+_me.properties.parentSize.width*0.500+_me.properties.offsets.x, -_me.properties.parentSize.height*0.500, _me.properties.offsets.z))
    verts.push(new THREE.Vector3(_me.properties.lightSize.width+_me.properties.parentSize.width*0.500+_me.properties.offsets.x, _me.properties.parentSize.height*0.500, _me.properties.offsets.z))
    faces.push(new THREE.Face3(0, 1, 2));
    _me.rightLight=getBasicLight('rightLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(0, _me.properties.parentSize.height*0.500+_me.properties.offsets.y, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500, _me.properties.lightSize.height+_me.properties.parentSize.height*0.500+_me.properties.offsets.y, _me.properties.offsets.z))
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500, _me.properties.lightSize.height+_me.properties.parentSize.height*0.500+_me.properties.offsets.y, _me.properties.offsets.z))
    faces.push(new THREE.Face3(0, 1, 2));
    _me.topLight=getBasicLight('topLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(0, -_me.properties.parentSize.height*0.500-_me.properties.offsets.y, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500, -_me.properties.lightSize.height-_me.properties.parentSize.height*0.500-_me.properties.offsets.y, _me.properties.offsets.z))
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500, -_me.properties.lightSize.height-_me.properties.parentSize.height*0.500-_me.properties.offsets.y, _me.properties.offsets.z))
    faces.push(new THREE.Face3(0, 1, 2));
    _me.bottomLight=getBasicLight('bottomLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
  }
  function squareLights() {
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500-_me.properties.offsets.x, -_me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(-_me.properties.lightSize.width-_me.properties.parentSize.width*0.500-_me.properties.offsets.x, _me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(-_me.properties.lightSize.width-_me.properties.parentSize.width*0.500-_me.properties.offsets.x, -_me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500-_me.properties.offsets.x, _me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    faces.push(new THREE.Face3(0, 1, 2));
    faces.push(new THREE.Face3(0, 3, 1));
    _me.leftLight=getBasicLight('leftLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500+_me.properties.offsets.x, -_me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(_me.properties.lightSize.width+_me.properties.parentSize.width*0.500+_me.properties.offsets.x, -_me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(_me.properties.lightSize.width+_me.properties.parentSize.width*0.500+_me.properties.offsets.x, _me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500+_me.properties.offsets.x, _me.properties.parentSize.height*0.500, _me.properties.offsets.z));
    faces.push(new THREE.Face3(0, 1, 2));
    faces.push(new THREE.Face3(0, 2, 3));
    _me.rightLight=getBasicLight('rightLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500, _me.properties.parentSize.height*0.500+_me.properties.offsets.y, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500, _me.properties.lightSize.height+_me.properties.parentSize.height*0.500+_me.properties.offsets.y, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500, _me.properties.lightSize.height+_me.properties.parentSize.height*0.500+_me.properties.offsets.y, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500, _me.properties.parentSize.height*0.500+_me.properties.offsets.y, _me.properties.offsets.z));
    faces.push(new THREE.Face3(0, 1, 2));
    faces.push(new THREE.Face3(0, 3, 1));
    _me.topLight=getBasicLight('topLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
    verts=[]; 
    faces=[]; 
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500, -_me.properties.parentSize.height*0.500-_me.properties.offsets.y, _me.properties.offsets.z));
    verts.push(new THREE.Vector3(-_me.properties.parentSize.width*0.500, -_me.properties.lightSize.height-_me.properties.parentSize.height*0.500-_me.properties.offsets.y, _me.properties.offsets.z))
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500, -_me.properties.lightSize.height-_me.properties.parentSize.height*0.500-_me.properties.offsets.y, _me.properties.offsets.z))
    verts.push(new THREE.Vector3(_me.properties.parentSize.width*0.500, -_me.properties.parentSize.height*0.500-_me.properties.offsets.y, _me.properties.offsets.z));
    faces.push(new THREE.Face3(0, 1, 2));
    faces.push(new THREE.Face3(0, 2, 3));
    _me.bottomLight=getBasicLight('bottomLight', verts, faces, _me.properties.initColor, _me.properties.initOpacity, _me.properties.isTransparent);
  }
  function imageLights(image) {

  }
  //Select Light Type
  if(_me.properties.name=='triangleLights') {triangleLights();}
  else if(_me.properties.name=='squareLights') {squareLights();}
  else if(_me.properties.name=='imageLights') {imageLights(image);}
  
  //Add to display 
  if(_me.leftLight) {_me.add(_me.leftLight);}
  if(_me.rightLight) {_me.add(_me.rightLight);}
  if(_me.topLight) {_me.add(_me.topLight);}
  if(_me.bottomLight) {_me.add(_me.bottomLight);}

  this.debugLightsOn=false;
};
MyQuadLightsMesh.prototype = Object.create(THREE.Mesh.prototype);
MyQuadLightsMesh.prototype.debugOn = function(toggleOn) {
  if(toggleOn) {
    this.setOpacity(1, 1, 1, 1);
  } 
  this.debugLightsOn=toggleOn;
};
MyQuadLightsMesh.prototype.setOpacity = function(topLight, rightLight, bottomLight, leftLight) {
  if(!this.debugLightsOn) {
    if(this.topLight) {this.topLight.material.opacity=topLight/255;}
    if(this.rightLight) {this.rightLight.material.opacity=rightLight/255;} 
    if(this.bottomLight) {this.bottomLight.material.opacity=bottomLight/255;}
    if(this.leftLight) {this.leftLight.material.opacity=leftLight/255;}
  }
};

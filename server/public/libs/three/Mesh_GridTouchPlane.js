Mesh_GridTouchPlane=function(name, width, height, boxSize, camera, planeRotation, isPlaneVisible, isGridVisible, lightSize) {
  THREE.Mesh.call(this);
  
  this.name=name;
  this.width=width;
  this.height=height;
  this.boxSize=boxSize;
  this.camera=camera;
  this.pathCount=0;
  //Plane	
  this.planeMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), new THREE.MeshBasicMaterial({color:0xd3d3d3}));
  this.planeMesh.rotation.x=planeRotation;
  this.planeMesh.visible=isPlaneVisible;
  this.add(this.planeMesh);

  //Grid Lines	
  var geometry = new THREE.Geometry();
  var startX=this.planeMesh.position.x - width*0.500;
  var startY=this.planeMesh.position.y - height*0.500;
  var xLimit=width/boxSize;
  for (var i=0;i<=xLimit;i++) {
          geometry.vertices.push(new THREE.Vector3(startX + boxSize*i, 0, startY));
          geometry.vertices.push(new THREE.Vector3(startX + boxSize*i, 0, startY + height));
  }
  var yLimit=height/boxSize;
  for (var i=0;i<=yLimit;i++) {
          geometry.vertices.push( new THREE.Vector3(startX, 0, startY + boxSize*i));
          geometry.vertices.push( new THREE.Vector3(startX + width, 0, startY + boxSize*i));
  }
  var material=new THREE.LineBasicMaterial({color: 0x000000, opacity:0.2, transparent:true});
  this.gridLines=new THREE.Line(geometry, material);
  this.gridLines.rotation.x=planeRotation+Math.PI*0.500;
  this.gridLines.type=THREE.LinePieces;
  this.gridLines.visible=isGridVisible;
  this.add(this.gridLines);
  
  //Point Geometery
  this.pointGeo=new THREE.PlaneGeometry(this.boxSize, this.boxSize);
  //Point Materials
  this.materialIndex=0;
  
  this.pathMaterials=[];
  var lineWidth=20;
  this.pathMaterials.push(new THREE.MeshBasicMaterial({linewidth:lineWidth, color:0xff0000, opacity:1.0, transparent:true}));
  this.pathMaterials.push(new THREE.MeshBasicMaterial({linewidth:lineWidth, color:0x00ff00, opacity:1.0, transparent:true}));
  this.pathMaterials.push(new THREE.MeshBasicMaterial({linewidth:lineWidth, color:0x0000ff, opacity:1.0, transparent:true}));
  this.pathMaterials.push(new THREE.MeshBasicMaterial({linewidth:lineWidth, color:0xff00ff, opacity:1.0, transparent:true}));
  this.pathMaterials.push(new THREE.MeshBasicMaterial({linewidth:lineWidth, color:0xffff33, opacity:1.0, transparent:true}));
  this.pathMaterials.push(new THREE.MeshBasicMaterial({linewidth:lineWidth, color:0xff9900, opacity:1.0, transparent:true}));
  this.pathMaterials.push(new THREE.MeshBasicMaterial({linewidth:lineWidth, color:0xffffff, opacity:1.0, transparent:true}));
  
  this.lineMaterials=[];
  lineWidth=1;
  this.lineMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff0000, opacity:1.0, transparent:true}));
  this.lineMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0x00ff00, opacity:1.0, transparent:true}));
  this.lineMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0x0000ff, opacity:1.0, transparent:true}));
  this.lineMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff00ff, opacity:1.0, transparent:true}));
  this.lineMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xffff33, opacity:1.0, transparent:true}));
  this.lineMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff9900, opacity:1.0, transparent:true}));
  this.lineMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xffffff, opacity:1.0, transparent:true}));
 
  this.pathStartMaterials=[];
  lineWidth=2;
  transparent=true;
  opacity=1.0;
  this.pathStartMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff0000, opacity:opacity, transparent:transparent}));
  this.pathStartMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0x00ff00, opacity:opacity, transparent:transparent}));
  this.pathStartMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0x0000ff, opacity:opacity, transparent:transparent}));
  this.pathStartMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff00ff, opacity:opacity, transparent:transparent}));
  this.pathStartMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xffff33, opacity:opacity, transparent:transparent}));
  this.pathStartMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff9900, opacity:opacity, transparent:transparent}));
  this.pathStartMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xffffff, opacity:opacity, transparent:transparent}));
 
  this.pathStopMaterials=[];
  lineWidth=1;
  this.pathStopMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff0000, opacity:1.0, transparent:true}));
  this.pathStopMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0x00ff00, opacity:1.0, transparent:true}));
  this.pathStopMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0x0000ff, opacity:1.0, transparent:true}));
  this.pathStopMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff00ff, opacity:1.0, transparent:true}));
  this.pathStopMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xffff33, opacity:1.0, transparent:true}));
  this.pathStopMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xff9900, opacity:1.0, transparent:true}));
  this.pathStopMaterials.push(new THREE.LineBasicMaterial({linewidth:lineWidth, color:0xffffff, opacity:1.0, transparent:true}));
  
  ///Rollover
  var material=new THREE.MeshBasicMaterial({color:0x7ec0ee, opacity:1.0, transparent:true});
  this.rolloverMesh=new THREE.Mesh(this.pointGeo, material);
  this.rolloverMesh.visible=false;
  this.add(this.rolloverMesh);
  //Rollover Halo
  this.rolloverHaloMaterial=new THREE.MeshBasicMaterial({color:0x7ec0ee, opacity:1.0, transparent:true});
  this.rolloverHaloPoints=[];
  this.rolloverHaloBlinkRate=200;
  this.rolloverHaloLastBlink=new Date().getTime();
  this.rolloverHaloIsVisible=false;
  var posMag=10;
  var relaPos=[{x:posMag, y:posMag}, {x:posMag, y:-posMag}, {x:-posMag, y:posMag}, {x:-posMag, y:-posMag}];
  for(var i=0;i<relaPos.length;i++) {
    var gridPoint=new THREE.Mesh(this.pointGeo, this.rolloverHaloMaterial);
    gridPoint.position=new THREE.Vector3(relaPos[i].x, relaPos[i].y, 0);
    this.rolloverMesh.add(gridPoint);
    this.rolloverHaloPoints.push(gridPoint);
  }
 
  //Path Halos
  this.pathHalos=[]; 

  //Path Points 
  this.pointsAdded=[];
  //Euglena Path Points
  this.euglenaPointsAdded=[];
  
  this.projector=new THREE.Projector();
  this.raycaster=null;
  this.mouse2D=new THREE.Vector3(0, 0, 0);
  this.voxelPosition=new THREE.Vector3();

  this.tmpVec=new THREE.Vector3(); 
  this.normalMatrix=new THREE.Matrix3();

  this.pathPoints={};
  this.pathLines=[];
  this.pathPointsDoDraw=false;

  //Lights 
  if(lightSize===null || lightSize===undefined) {lightSize=10;} 
  var properties={
    name:'squareLights', isTransparent:true, initOpacity:1.0, initColor:0xfff000,
    parentSize:{width:this.width, height:this.height},
    lightSize:{width:lightSize, height:lightSize},
    offsets:{x:1, y:1, z:1},
  };  
  this.lights=new MyQuadLightsMesh(properties) 
  this.add(this.lights);
};
Mesh_GridTouchPlane.prototype = Object.create(THREE.Mesh.prototype);
Mesh_GridTouchPlane.prototype.runReset = function() {
  for(var i=0;i<this.pathHalos.length;i++) {
    for(var j=0;j<this.pathHalos[i].points.length;j++) {
      this.remove(this.pathHalos[i].points[j]);
    }
  }
  this.pathHalos=[];
};
Mesh_GridTouchPlane.prototype.reset = function() {
  
  //Path Points 
  for(var i=0;i<this.pointsAdded.length;i++) {
    this.remove(this.pointsAdded[i]);
  }
  this.pointsAdded=[];
 
  //Euglena Path Points 
  for(var i=0;i<this.euglenaPointsAdded.length;i++) {
    this.remove(this.euglenaPointsAdded[i]);
  }
  this.euglenaPointsAdded=[];

  //Path Halos 
  for(var i=0;i<this.pathHalos.length;i++) {
    for(var j=0;j<this.pathHalos[i].points.length;j++) {
      this.remove(this.pathHalos[i].points[j]);
    }
  }
  this.pathHalos=[];
 

  this.pathPoints={};
  this.pathPointsDoDraw=false;
  for(var i=0;i<this.pathLines.length;i++) {
    this.remove(this.pathLines[i]);
  }
  this.pathLines=[];
};
Mesh_GridTouchPlane.prototype.updateLights = function(x, y) {
  var l=0; var r=0; var t=0; var b=0;
  if(x>0) {r=Math.abs(x);}
  else {l=Math.abs(x);}
  if(y>0) {t=Math.abs(y);}
  else {b=Math.abs(y);}
  this.lights.setOpacity(l, r, t, b);
};
Mesh_GridTouchPlane.prototype.update = function(dt, width, height) {
  var timeNow=new Date().getTime();
  this.width=width;
  this.height=height;
  //Draw Lines Between Points
  if(this.pathPointsDoDraw) {
    this.pathPointsDoDraw=false;
    var paths=Object.keys(this.pathPoints);
    for(var i=0;i<paths.length;i++) {
      var myPoints=this.pathPoints[paths[i]];
      //Create line
      var geo=new THREE.Geometry();
      var mat=myPoints[0].matLine;
      for(var j=0;j<myPoints.length;j++) {geo.vertices.push(myPoints[j].gridPoint.position);}
      if(geo) {
        var line=new THREE.Line(geo, mat);
        this.add(line);
        this.pathLines.push(line);
      }

      //Add Start Marker
      var myPoint=myPoints[0];
      mat=myPoint.matStart;
      
      geo=new THREE.Geometry();
      geo.vertices.push(new THREE.Vector3(myPoint.gridPoint.position.x+10, myPoint.gridPoint.position.y-10, myPoint.gridPoint.position.z));
      geo.vertices.push(new THREE.Vector3(myPoint.gridPoint.position.x-10, myPoint.gridPoint.position.y+10, myPoint.gridPoint.position.z));
      line=new THREE.Line(geo, mat);
      this.add(line);
      this.pathLines.push(line);


      geo=new THREE.Geometry();
      geo.vertices.push(new THREE.Vector3(myPoint.gridPoint.position.x-10, myPoint.gridPoint.position.y-10, myPoint.gridPoint.position.z));
      geo.vertices.push(new THREE.Vector3(myPoint.gridPoint.position.x+10, myPoint.gridPoint.position.y+10, myPoint.gridPoint.position.z));
      line=new THREE.Line(geo, mat);
      this.add(line);
      this.pathLines.push(line);
    }
  } 
  //Path Point Halo 
  for(var i=0;i<this.pathHalos.length;i++) {
    var halo=this.pathHalos[i];
    if(timeNow-halo.lastBlink>halo.blinkRate) {
      halo.lastBlink=timeNow;
      if(halo.isVisible) {halo.isVisible=false;}
      else {halo.isVisible=true;}
      for(var i=0;i<halo.points.length;i++) {halo.points[i].visible=halo.isVisible;}
    }
  } 
  //Set Mouse Ray Caster
  this.raycaster=this.projector.pickingRay(this.mouse2D.clone(), this.camera);
  //Check Mouse Hover Point
  var intersector=this.getIntersector(this.raycaster, this.planeMesh);
  //Set Mouse Hover Point if it Intersects
  if(intersector) {
    this.rolloverMesh.visible=true;
    if(timeNow-this.rolloverHaloLastBlink>this.rolloverHaloBlinkRate) {
      this.rolloverHaloLastBlink=timeNow;
      if(this.rolloverHaloIsVisible) {
        this.rolloverHaloIsVisible=false;
        for(var i=0;i<this.rolloverHaloPoints.length;i++) {
          var pt=this.rolloverHaloPoints[i];
          pt.visible=false; 
        }
      } else {
        this.rolloverHaloIsVisible=true;
        for(var i=0;i<this.rolloverHaloPoints.length;i++) {
          var pt=this.rolloverHaloPoints[i];
          pt.visible=true; 
        }
      }
    }
    this.setHoverPositionFromIntersector(this.rolloverMesh, intersector);
  } else {
    this.rolloverHaloLastBlink=timeNow
    this.rolloverMesh.visible=false;
    for(var i=0;i<this.rolloverHaloPoints.length;i++) {
      var pt=this.rolloverHaloPoints[i];
      pt.visible=false; 
    }
  }
};
Mesh_GridTouchPlane.prototype.getIntersectorPosition = function(intersector) {
	var tempVector=new THREE.Vector3(); 
	var tempMatrix=new THREE.Matrix3();
	tempMatrix.getNormalMatrix(intersector.object.matrixWorld);
	tempVector.copy(intersector.face.normal);
	tempVector.applyMatrix3(this.normalMatrix).normalize();
	var vector=new THREE.Vector3();
	vector.addVectors(intersector.point, tempVector);
	vector.divideScalar(this.boxSize).floor().multiplyScalar(this.boxSize).addScalar(this.boxSize*0.500);
	vector.z=0;
	return vector;
};
Mesh_GridTouchPlane.prototype.getIntersector = function(raycaster, object) {
	var intersects=raycaster.intersectObject(object);
	for(var i=0;i<intersects.length;i++) {
		var intersector=intersects[i];
		if(intersector.object!=this.rollOverMesh) {return intersector;}
	}
	return null;
};
Mesh_GridTouchPlane.prototype.setHoverPositionFromIntersector = function(object, intersector) {
  var tempVector=new THREE.Vector3(); 
  var tempMatrix=new THREE.Matrix3();
  tempMatrix.getNormalMatrix(intersector.object.matrixWorld);
  tempVector.copy(intersector.face.normal);
  tempVector.applyMatrix3(this.normalMatrix).normalize();
  var vector=new THREE.Vector3();
  vector.addVectors(intersector.point, tempVector);
  vector.divideScalar(this.boxSize).floor().multiplyScalar(this.boxSize).addScalar(this.boxSize*0.500);
  vector.z=0;
  object.position=vector;	
};
Mesh_GridTouchPlane.prototype.setPositionFromIntersector = function(object, intersector) {
  var tempVector=new THREE.Vector3(); 
  var tempMatrix=new THREE.Matrix3();
  tempMatrix.getNormalMatrix(intersector.object.matrixWorld);
  tempVector.copy(intersector.face.normal);
  tempVector.applyMatrix3(this.normalMatrix).normalize();
  var vector=new THREE.Vector3();
  vector.addVectors(intersector.point, tempVector);
  vector.divideScalar(this.boxSize).floor().multiplyScalar(this.boxSize).addScalar(this.boxSize*0.500);
  vector.z=0;
  object.position=vector;	
};

//Point Sets
//Halos
Mesh_GridTouchPlane.prototype.addGridPointHalo = function(pointObj, color, size) {
  var newHalo={
    points:[],
    blinkRate:500,
    lastBlink:new Date().getTime(),
    isVisible:false,
  }
  //Create Path Point Halo
  var relaPos=[{x:size, y:size}, {x:size, y:-size}, {x:-size, y:size}, {x:-size, y:-size}];
  var mat=new THREE.MeshBasicMaterial({color:color, opacity:1.0, transparent:true})
  for(var i=0;i<relaPos.length;i++) {
    var gridPoint=new THREE.Mesh(this.pointGeo, mat);
    gridPoint.position=new THREE.Vector3(pointObj.x+relaPos[i].x, pointObj.y+relaPos[i].y, 1);
    gridPoint.visible=newHalo.isVisible;
    this.add(gridPoint);
    newHalo.points.push(gridPoint);
  }
  this.pathHalos.push(newHalo);
};
//Path Point
Mesh_GridTouchPlane.prototype.addGridPoint = function(pointObj, doPathLines) {
  //Create New Point Object
  var matIndex=0;
  var mat=this.pathMaterials[matIndex];
  var gridPoint=new THREE.Mesh(this.pointGeo, mat);
  gridPoint.position=new THREE.Vector3(pointObj.x, pointObj.y, 0);
  this.add(gridPoint);
  this.pointsAdded.push(gridPoint);
  if(doPathLines) {
    var str=''+pointObj.pathIndex;
    if(this.pathPoints[str]==null) {
      this.pathPoints[str]=[];
      this.pathPoints[str].push({gridPoint:gridPoint, 
        matLine:this.lineMaterials[matIndex+1], matStart:this.pathStartMaterials[matIndex+2], 
        matStop:this.pathStopMaterials[matIndex+3]});
    } else {
      this.pathPoints[str].push({gridPoint:gridPoint});
    }
    this.pathPointsDoDraw=true;
  }
};
Mesh_GridTouchPlane.prototype.addGridPointFromMouseClick = function(x, y, width, height, pathIndex) {
  //Convert to Local Coordinates
  var localPoint=this.localPoint(x, y, width, height);
  //Set Click Point Ray Caster
  var raycaster=this.projector.pickingRay(new THREE.Vector3(localPoint.x, localPoint.y, 0), this.camera);
  //Check Mouse Hover Point
  var intersector=this.getIntersector(raycaster, this.planeMesh);
  if(intersector) {
    //Create New Point Object
    var mat=this.pathMaterials[pathIndex%this.pathMaterials.length];
    var gridPoint=new THREE.Mesh(this.pointGeo, mat);
    this.add(gridPoint);
    this.pointsAdded.push(gridPoint);
    //Set Grid Point if it Intersects
    this.setPositionFromIntersector(gridPoint, intersector);
    //Create Path Object
    var hexColor='#' + mat.color.getHexString();
    var pointObj={x:gridPoint.position.x, y:gridPoint.position.y, pathColor:hexColor};
    return pointObj;
  }
  return null;
};
//Euglena Path Point
Mesh_GridTouchPlane.prototype.addGridPointEuglena = function(pointObj, doPathLines) {
  //Create New Point Object
  var matIndex=3;
  var mat=this.pathMaterials[matIndex];
  var gridPoint=new THREE.Mesh(this.pointGeo, mat);
  gridPoint.position=new THREE.Vector3(pointObj.x, pointObj.y, 0);
  this.add(gridPoint);
  this.euglenaPointsAdded.push(gridPoint);
  if(doPathLines) {
    var str=''+pointObj.pathIndex;
    if(this.pathPoints[str]==null) {
      this.pathPoints[str]=[];
      this.pathPoints[str].push({gridPoint:gridPoint, 
        matLine:this.lineMaterials[matIndex+1], matStart:this.pathStartMaterials[matIndex+2], 
        matStop:this.pathStopMaterials[matIndex+3]});
    } else {
      this.pathPoints[str].push({gridPoint:gridPoint});
    }
    this.pathPointsDoDraw=true;
  }
};


//Mouse/point helpers
Mesh_GridTouchPlane.prototype.getGridPointFromMouseClick = function(x, y, hoverOffset, width, height) {
  //Convert to Local Coordinates
  var localPoint=this.localPoint(x+hoverOffset.x, y+hoverOffset.y, width, height);
  //Set Click Point Ray Caster
  var raycaster=this.projector.pickingRay(new THREE.Vector3(localPoint.x, localPoint.y, 0), this.camera);
  //Check Mouse Hover Point
  var intersector=this.getIntersector(raycaster, this.planeMesh);
  if(intersector) {
    //Create Temp Point Object to position
    var mat=this.pathMaterials[0];
    var gridPoint=new THREE.Mesh(this.pointGeo, mat);
    this.setPositionFromIntersector(gridPoint, intersector);
    return {x:gridPoint.position.x, y:gridPoint.position.y};
  } else {return null;} 
};

Mesh_GridTouchPlane.prototype.setMousePoint = function(x, y, hoverOffset, width, height) {
  var page=document.getElementsByClassName('page')[0].childNodes[0];
  var point=this.localPoint(x+hoverOffset.x, y+hoverOffset.y, width, height);
  this.mouse2D.x=point.x;
  this.mouse2D.y=point.y;
};
Mesh_GridTouchPlane.prototype.getMousePoint = function(x, y, hoverOffset, width, height) {
  var page=document.getElementsByClassName('page')[0].childNodes[0];
  var point=this.localPoint(x+hoverOffset.x, y+hoverOffset.y, width, height);
  return new THREE.Vector3(point.x, point.y, 0);
};
Mesh_GridTouchPlane.prototype.localPoint = function(x, y, width, height) {
  var point={x:(x/width)*2-1, y:-((y)/height)*2+1,};
  return point;
}

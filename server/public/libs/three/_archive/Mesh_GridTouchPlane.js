Mesh_GridTouchPlane=function(name, x, y, width, height,boxSize, camera,  parentWidth, parentHeight, planeRotation, isPlaneVisible, isGridVisible) 
{
	THREE.Mesh.call(this);
	
	this.name=name;
	this.width=width;
	this.height=height;
	this.boxSize=boxSize;
	this.camera=camera;
	//Plane	
	this.planeMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), new THREE.MeshBasicMaterial({color:0xd3d3d3}));
	this.planeMesh.rotation.x=planeRotation;
	this.planeMesh.position.x=x+width*0.500;
	this.planeMesh.position.y=-(y+height*0.500);
	this.planeMesh.visible=isPlaneVisible;
	this.add(this.planeMesh);

	//Grid Lines	
	var geometry = new THREE.Geometry();
	var xLimit=width/boxSize;
        console.log(xLimit);
	for (var i=0;i<=xLimit;i++) {
		geometry.vertices.push(new THREE.Vector3(x + boxSize*i, 0, y));
		geometry.vertices.push(new THREE.Vector3(x + boxSize*i, 0, y+ height));
	}
	var yLimit=height/boxSize;
	for (var i=0;i<=yLimit;i++) {
		geometry.vertices.push( new THREE.Vector3(x, 0, y + boxSize*i));
		geometry.vertices.push( new THREE.Vector3(x + width, 0, y + boxSize*i));
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
	this.pathMaterials.push(new THREE.MeshBasicMaterial({color:0xff0000, opacity:1.0, transparent:true}));
	this.pathMaterials.push(new THREE.MeshBasicMaterial({color:0x00ff00, opacity:1.0, transparent:true}));
	this.pathMaterials.push(new THREE.MeshBasicMaterial({color:0x0000ff, opacity:1.0, transparent:true}));
	this.pathMaterials.push(new THREE.MeshBasicMaterial({color:0xff00ff, opacity:1.0, transparent:true}));
	this.pathMaterials.push(new THREE.MeshBasicMaterial({color:0xffff33, opacity:1.0, transparent:true}));
	this.pathMaterials.push(new THREE.MeshBasicMaterial({color:0xff9900, opacity:1.0, transparent:true}));
	this.pathMaterials.push(new THREE.MeshBasicMaterial({color:0xffffff, opacity:1.0, transparent:true}));
	///Rollover
	var material=new THREE.MeshBasicMaterial({color:0x7ec0ee, opacity:1.0, transparent:true});
	this.rolloverMesh=new THREE.Mesh(this.pointGeo, material);
	this.add(this.rolloverMesh);

	this.points=[];
	this.projector=new THREE.Projector();
	this.raycaster=null;
	this.mouse2D=new THREE.Vector3(0, 0, 0);
	this.voxelPosition=new THREE.Vector3();

	this.tmpVec=new THREE.Vector3(); 
	this.normalMatrix=new THREE.Matrix3();
};
Mesh_GridTouchPlane.prototype = Object.create(THREE.Mesh.prototype);
Mesh_GridTouchPlane.prototype.reset = function() {
	for(var i=0;i<this.points.length;i++) {
		this.remove(this.points[i]);
	}
};
Mesh_GridTouchPlane.prototype.update = function(dt, width, height) {
	this.width=width;
	this.height=height;
	//Set Mouse Ray Caster
	this.raycaster=this.projector.pickingRay(this.mouse2D.clone(), this.camera);
	//Check Mouse Hover Point
	var intersector=this.getIntersector(this.raycaster, this.planeMesh);
	//Set Mouse Hover Point if it Intersects
	if(intersector) {this.setPositionFromIntersector(this.rolloverMesh, intersector);}
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
Mesh_GridTouchPlane.prototype.addGridPoint = function(x, y, width, height, pathIndex) {

	//console.log(x, y, width, height, pathIndex);
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
		this.points.push(gridPoint);
		//Set Grid Point if it Intersects
		this.setPositionFromIntersector(gridPoint, intersector);
		//Create Path Object
		var hexColor='#' + mat.color.getHexString();
		var pointObj={x:gridPoint.position.x, y:gridPoint.position.y, pathIndex:pathIndex, pathColor:hexColor, file:''};
		return pointObj;
	}
	return null;
};
Mesh_GridTouchPlane.prototype.addGridPoint2 = function(x, y, width, height, pathIndex) {
	x=100;
	y=100;
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
		this.points.push(gridPoint);
		//Set Grid Point if it Intersects
		this.setPositionFromIntersector(gridPoint, intersector);
		//Create Path Object
		var hexColor='#' + mat.color.getHexString();
		var pointObj={x:gridPoint.position.x, y:gridPoint.position.y, pathIndex:pathIndex, pathColor:hexColor, file:''};
		return pointObj;
	}
	return null;
};
Mesh_GridTouchPlane.prototype.setMousePoint = function(x, y, width, height) {
	var point=this.localPoint(x, y, width, height);
	this.mouse2D.x=point.x;
	this.mouse2D.y=point.y;
	return {x:point.x, y:point.y};
};
Mesh_GridTouchPlane.prototype.localPoint = function(x, y, width, height) {
	var point={
		x:(x/width)*2-1, 
		y:-((y)/height)*2+1,
	};
	return point;
}



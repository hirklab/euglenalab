Mesh_Image=function(name, texture, material, showBorder, width, height, text) 
{
  THREE.Mesh.call(this);
  this.name=name;
  this.imageMesh=null;
  this.frameMesh=null;
  var pct=1.0;
  this.width=width*pct;
  this.height=height*pct;

  this.imageMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), material);
  this.imageMesh.position.z=1;
  this.add(this.imageMesh);

  if(showBorder) {
    var geometryFrame=new THREE.PlaneGeometry(this.width+borderWidth, this.height+borderWidth);
    var frameMaterial=new THREE.MeshBasicMaterial( {
      color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 5 
    });
    this.frameMesh=new THREE.Mesh(geometryFrame, frameMaterial);
    this.add(this.frameMesh);
  }
  
  if(text!==null && text!==undefined && text.length>0) {
    var textMesh=new Mesh_Text('imageInfo', text);
    textMesh.position.x=-100; 
    this.add(textMesh);
  } 
};

Mesh_Image.prototype = Object.create(THREE.Mesh.prototype);

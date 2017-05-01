Mesh_Image=function(name, texture, material, showBorder, parentWidth, parentHeight) {
  THREE.Mesh.call(this);
  this.name=name;
  this.imageMesh=null;
  this.frameMesh=null;
  this.width=texture.image.width;
  this.height=texture.image.height;
  var borderWidth=this.height*0.05;

  this.imageMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), material);
  this.imageMesh.position.z=0;
  this.add(this.imageMesh);

  if(showBorder) {
    var geometryFrame=new THREE.PlaneGeometry(this.width+borderWidth, this.height+borderWidth);
    var frameMaterial=new THREE.MeshBasicMaterial( {
      color: 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 5 
    });
    this.frameMesh=new THREE.Mesh(geometryFrame, frameMaterial);
    this.add(this.frameMesh);
  }
};

Mesh_Image.prototype = Object.create(THREE.Mesh.prototype);
Mesh_Image.prototype.update = function(dt) {
  console.log('Mesh_Image', 'update');
};

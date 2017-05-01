Mesh_Image_ruler=function(name, texture, material, parentWidth, parentHeight) 
{
  THREE.Mesh.call(this);
  this.name=name;
  this.imageMesh=null;
  this.frameMesh=null;
  this.width=texture.image.width;
  this.height=texture.image.height;

  this.imageMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), material);
  this.imageMesh.colorsNeedUpdate=true;
  this.imageMesh.position.z=1;
  this.add(this.imageMesh);

  this.circleMesh=null; 
  this.plusMesh=null; 

};

Mesh_Image_ruler.prototype=Object.create(THREE.Mesh.prototype);

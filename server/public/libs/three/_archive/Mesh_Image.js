Mesh_Image=function(name, texture, material, width, height) 
{
	THREE.Mesh.call(this);
	this.name=name;
	this.imageMesh=null;
	this.width=texture.image.width;
	this.height=texture.image.height;

	this.imageMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), material);
	this.imageMesh.position.x=this.width*0.500;
	this.imageMesh.position.y=-this.height*0.500;
	this.imageMesh.position.z=0;
	this.add(this.imageMesh);

	this.isImageReady=false;
};

Mesh_Image.prototype=Object.create(THREE.Mesh.prototype);
Mesh_Image.prototype.update=function(dt) 
{
	console.log('Mesh_Image', 'update');
};

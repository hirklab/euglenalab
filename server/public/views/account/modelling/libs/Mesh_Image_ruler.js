Mesh_Image_ruler=function(name, texture, material, parentWidth, parentHeight) 
{
  THREE.Mesh.call(this);
  this.name=name;
  this.imageMesh=null;
  this.frameMesh=null;
  this.width=texture.image.width;
  this.height=texture.image.height*0.500;

  this.imageMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), material);
  this.imageMesh.colorsNeedUpdate=true;
  this.imageMesh.position.z=0;
  this.add(this.imageMesh);

  this.circleMesh=null; 
/*

  var material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); 
  var radius = 10; 
  var segments = 32; 
  var circleGeometry = new THREE.CircleGeometry( radius, segments );	
  var circle = new THREE.Mesh( circleGeometry, material ); 
  this.imageMesh.add(circle);
  circle.position=new THREE.Vector3(-this.width*0.5+20, 0, 5);
*/
};

Mesh_Image_ruler.prototype=Object.create(THREE.Mesh.prototype);
Mesh_Image_ruler.prototype.addRotation = function() {
  var me=this;
  var path='/media/aiqeqeM5T.png'
  var cbb_Loaded=function () {
    texture.needsUpdate=true;
    //Remove Old Image 
    //Create new Background Image
    var material=new THREE.MeshBasicMaterial({alpha:true, map:texture});
    material.transparent=true;
    var rotCircle=new THREE.Mesh(new THREE.PlaneGeometry(texture.image.width*0.250, texture.image.height*0.250), material);
    rotCircle.position.x=me.width*0.250;
    rotCircle.position.y=0;
    me.imageMesh.add(rotCircle);
    me.circleMesh=rotCircle; 
  };
  var cbb_Err=function(err) {
    console.log('loadImage ERROR: ', err);
  };
  //Load Texture 
  var texture=THREE.ImageUtils.loadTexture(path, THREE.UVMapping, cbb_Loaded, cbb_Err);
  texture.minFilter=texture.magFilter=THREE.LinearFilter;
} 
Mesh_Image_ruler.prototype.update = function(dt) {
  console.log('Mesh_Image_ruler', 'update');
};

Mesh_Image_button=function(name, texture, material, widthPct, heightPct) 
{
  THREE.Mesh.call(this);
  this.name=name;
  this.imageMesh=null;
  this.frameMesh=null;
  this.width=texture.image.width*widthPct;
  this.height=texture.image.height*heightPct;

  this.imageMesh=new THREE.Mesh(new THREE.PlaneGeometry(this.width, this.height), material);
  this.imageMesh.colorsNeedUpdate=true;
  this.imageMesh.position.z=0;
  this.add(this.imageMesh);

  this.isClickable=true;
  this.buttonStates={up:'up', down:'down', hover:'hover'};
  this.buttonState=this.buttonStates.up;


  this.downScale=0.850;
  this.upScale=1.0;
  this.pulseObj={
    min:0.750, max:this.downScale, step:0.01, rate:200,
        current:this.upScale, goingDown:false,
  }
};
Mesh_Image_button.prototype=Object.create(THREE.Mesh.prototype);
Mesh_Image_button.prototype.resizeForDown = function() {
  this.buttonState=this.buttonStates.down;
  this.pulseObj.current=this.downScale;
  this.imageMesh.scale.x=this.downScale;
  this.imageMesh.scale.y=this.downScale;
};
Mesh_Image_button.prototype.resizeForUp = function() {
  this.buttonState=this.buttonStates.up;
  this.pulseObj.current=this.upScale;
  this.imageMesh.scale.x=this.upScale;
  this.imageMesh.scale.y=this.upScale;
};
Mesh_Image_button.prototype.isDown = function() {
  if(this.buttonState===this.buttonStates.down) {
    return true;
  } else {
    return false;
  }
};

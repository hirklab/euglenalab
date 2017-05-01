MyCanvas_Image=function(properties, callbackFrameLoad) 
{
  //Class Variables
  this.canvas=null;
  this.context=null;
  this.image=null;
  this.properties=null;
  this.dt=0;
  this.displayText=null;
  this.frameObjects=null;
  //Check Properties
  properties=checkCanvasImageProperties(properties);
  //Create Canvas
  var canvas=document.createElement('canvas');
  canvas.id=properties.canvasId;
  canvas.width=properties.width;
  canvas.height=properties.height;
  //Set Context 
  var context=canvas.getContext("2d");  
  //Set Image/Drawing
  var image=new Image(); 
  var widthRect=properties.width+properties.x;
  var heightRect=properties.height+properties.y;
  var displayText={text:''};
  var fontSize=16;
  var loadTime=null;
  var frameObjects=[];
  image.onload=function() {
    context.clearRect(properties.x, properties.y, properties.width, properties.height);
    context.drawImage(image, properties.x, properties.y, properties.width, properties.height);
    if(displayText && displayText.text && displayText.text.length>0) {

      context.beginPath();
      context.fillStyle="#ccooff";
      context.font=fontSize+'px Veranda';
      context.textAlign='right';
      context.fillText(displayText.text, properties.width, properties.height*0.000+Number(fontSize));
    }
    if(callbackFrameLoad) {
      var loadTime=new Date().getTime(); 
      for(var i=0;i<frameObjects.length;i++) {
        if(image.src=frameObjects[i].src) {
          callbackFrameLoad(frameObjects[i].frameTime, loadTime, image.src);
          frameObjects.splice(i, 1);
          break;
        }
      }
    }
  } 
  //Set Class Variables
  this.canvas=canvas;
  this.context=context;
  this.image=image;
  this.properties=properties;
  this.dtUpdate=0;
  this.displayText=displayText;
  //Return
  return this;
};
MyCanvas_Image.prototype=Object.create(Object.prototype);
MyCanvas_Image.prototype.updateByName=function(dt, name, text) {
  this.properties.imageName=name;
  this.update(dt, this.properties.mediaPath+'/'+name, text);
};
MyCanvas_Image.prototype.update=function(dt, path, text) {
  this.properties.imagePath=path;
  this.dtUpdate+=dt; 
  if(this.dt>=this.properties.updateRate) {
    this.dt=0;
    this.displayText.text=text;
    this.image.src=this.properties.imagePath;
  }
};
MyCanvas_Image.prototype.resize=function(width, height) 
{
  //this.properties.width=width;
  //this.properties.height=width;
  //this.canvas.width=width;
  //this.canvas.height=height;
};
MyCanvas_Image.prototype.setProperties=function(newProperties) 
{
  var keys=Object.keys(newProperties);
  for(var i=0;i<keys.length;i++) {
    var key=keys[i];
    if(this.properties.hasOwnProperty(key)) {
      this.properties[key]=newProperties[key];
    }
  }
};
function checkCanvasImageProperties(properties) {
  //Create Required Properties
  var requiredProperties={
    canvasId:'imageCaptureCanvas', 
    x:0, y:0, width:640, height:480, 
    updateRate:0, 
    mediaPath:'/media', imageName:'', 
    imagePath:''
  };

  //Check Incoming Properties
  if(properties==null) {properties=requiredProperties;}
  else {
    //Check for Properties
    for(var reqProp in requiredProperties) {
      //Add Property if it doesn't exist
      if(!properties.hasOwnProperty(reqProp)) {
        properties[reqProp]=requiredProperties[reqProp];
      }
    }
  }
  return properties;
};

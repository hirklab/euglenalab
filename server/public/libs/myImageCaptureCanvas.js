Canvas_Image=function(properties, callbackFrameLoad) 
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
  var fontSize=20;
  var loadTime=null;
  var frameObjects=[];
  image.onload=function() {
    context.clearRect(properties.x, properties.y, properties.width, properties.height);
    context.drawImage(image, properties.x, properties.y, properties.width, properties.height);
    
    if(displayText && displayText.text && displayText.text.length>0) {
      context.beginPath();
      context.fillStyle="#dd6600";
      context.font=fontSize+'px Veranda';
      context.fillText(displayText.text, properties.width*0.01, properties.height-Number(fontSize*0.500));
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
  this.dt=0;
  this.displayText=displayText;
  this.frameObjects=frameObjects; 
  
  //Return
  return this;
};
Canvas_Image.prototype=Object.create(Object.prototype);
Canvas_Image.prototype.update=function(dt, frameTime, text) {
  this.dt+=dt; 
  if(this.dt>=this.properties.updateRate) {
    this.dt=0;
    this.displayText.text=text;
    var frameObj={frameTime:frameTime, src:this.properties.url + frameTime}
    this.frameObjects.push(frameObj); 
    this.image.src=frameObj.src;
  }
};
Canvas_Image.prototype.setProperties=function(newProperties) 
{
  var keys=Object.keys(newProperties);
  for(var i=0;i<keys.length;i++) {
    var key=keys[i];
    if(this.properties.hasOwnProperty(key)) {
      this.properties[key]=newProperties[key];
    }
  }
  this.properties.url=makeUrl(this.properties);
};
Canvas_Image.prototype.resize=function(width, height) 
{
  //this.properties.width=width;
  //this.properties.height=width;
  //this.canvas.width=width;
  //this.canvas.height=height;
};
function makeUrl2(properties) {
  return 'http://' + properties.ip + ':' + properties.port + '/?action=' + properties.action + '?t=';
}
function makeUrl(properties) {
  return '' + properties.ip + '/' + properties.port + '/' + properties.action + '';
}
function checkCanvasImageProperties(properties) {
  //Create Required Properties
  var requiredProperties={
    canvasId:'imageCaptureCanvas', 
    x:0, y:0, width:640, height:480, 
    updateRate:200, 
    ip:'127.0.0.1', port:'8080', action:'snapshot',
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
  properties.url=makeUrl(properties);
  return properties;
};

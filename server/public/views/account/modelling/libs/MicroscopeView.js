MicroscopeView=function(properties) {
  THREE.Mesh.call(this);
  this.loadedImages={};
  //Path Colors
  var NormalColors=[0x7e17e6, 0x826b99, 0x6b9977, 0xe51717, 0x4d3636, 0x6b3d99, 0x0f9932, 0xe6e6e6, 0x993d3d, 0x000000, 0x361f4d, 0x084d19, 0x999999, 0x996b6b];
  var HighlightColors=[0xe51717, 0x4d3636, 0x999999, 0x6b9977, 0x361f4d, 0x993d3d, 0x000000, 0x0f9932, 0x7e17e6, 0x826b99, 0x996b6b, 0xe6e6e6, 0x084d19, 0x6b3d99];
  this.PathColors=[];
  for(var c=0;c<NormalColors.length;c++) {
    this.PathColors.push({normal:NormalColors[c], highlight:HighlightColors[c]});
  }

  //Properties
  this.name=properties.name;
  this.width=properties.size.width;
  this.height=properties.size.height;

  //Mouse Hover
  var hoverProperties={
    name:'mouseHover',
    index:-1, type:'x', size:10,
    color:0xffffff, highlightColor:0xffffff, doHighlight:false,
    point:{x:0, y:0, z:2},
  };
  this.mouseHover=new MyPoint(hoverProperties);
  this.mouseHover.name=hoverProperties.name;
  this.mouseHoverSize=0;//hoverProperties.size;
  this.mouseHover.toggleVisible(true);
  this.add(this.mouseHover);

  //Background
  this.material=new THREE.MeshBasicMaterial({color:properties.background.color, opacity:properties.background.opacity, transparent:true});
  this.geometry=new THREE.PlaneGeometry(properties.size.width, properties.size.height);
  this.position=new THREE.Vector3(0, 0, 0);

  //Light
  this.hasLights=false;
  this.light=null;
  if(properties.light!==null && properties.light!==undefined) {
    if(properties.light.hasLight) {
      this.hasLights=true;
      if(properties.light.lightSize===null || properties.light.lightSize===undefined) {properties.light.lightSize=10;}
      var lightProps={
        name:'squareLights', isTransparent:true, initOpacity:1.0, initColor:0xfff000,
        parentSize:{width:this.width, height:this.height},
        lightSize:{width:properties.light.lightSize, height:properties.light.lightSize},
        offsets:{x:1, y:1, z:1},
      };
      this.lights=new MyQuadLightsMesh(lightProps);
      this.lights.debugOn(properties.light.allOn);
      this.add(this.lights);
    }
  }

  //Grid Lines
  this.hasGridLines=false;
  this.gridLines=null;
  if(properties.grid!==null && properties.grid!==undefined) {
    if(properties.grid.hasGrid) {
      this.hasGridLines=true;
      this.boxSize=properties.grid.boxSize;
      var geometry = new THREE.Geometry();
      var startX=this.position.x - properties.size.width*0.500;
      var startY=this.position.y - properties.size.height*0.500;
      var xLimit=properties.size.width/this.boxSize;
      for (var i=0;i<=xLimit;i++) {
        geometry.vertices.push(new THREE.Vector3(startX + this.boxSize*i, 0, startY));
        geometry.vertices.push(new THREE.Vector3(startX + this.boxSize*i, 0, startY + properties.size.height));
      }
      var yLimit=properties.size.height/this.boxSize;
      for (var i=0;i<=yLimit;i++) {
        geometry.vertices.push( new THREE.Vector3(startX, 0, startY + this.boxSize*i));
        geometry.vertices.push( new THREE.Vector3(startX + properties.size.width, 0, startY + this.boxSize*i));
      }
      var material=new THREE.LineBasicMaterial({color: 0xff0000, opacity:0.2, transparent:true});
      this.gridLines=new THREE.Line(geometry, material);
      this.gridLines.type=THREE.LinePieces;
      this.gridLines.visible=properties.grid.isVisible;
      this.gridLines.rotation.x=Math.PI*0.5;
      this.gridLines.position.z=5;
      this.add(this.gridLines);
    }
  }
  this.playImageLightData=[];
  this.playImageFrame=0;
  this.playImageTime=0;
  this.playtime=0;
  this.properties=properties;
  this.resetData(properties);
  this.lightValues={led1:0, led2:0, led3:0, led4:0};
  this.newPath=null;
  this.staticPath=null;
  this.imageCounter=0;
};
MicroscopeView.prototype = Object.create(THREE.Mesh.prototype);
//Reset
MicroscopeView.prototype.resetData=function(properties) {
  this.loadedImages={};
  //Image
  this.properties=properties;
  this.hasImage=false;
  this.imageLightData=[];
  this.currentImage=null;
  this.currentImageFrame=0;
  this.currentImageTime=0;
  this.playData={};
  if(properties.image!==null && properties.image!==undefined) {
    if(properties.image.hasImage) {
      this.hasImage=true;
      //Check Active Image
      if(properties.image.activeImage && properties.image.activeImage.frameNumber) {
        this.currentImage=properties.image.activeImage;
        this.currentImageFrame=this.currentImage.frameNumber;
        this.currentImageTime=this.currentImage.frameTime;
      }
      //Finish Image Objects
      properties.image.images.sort(function(a, b) {return a.timestamp-b.timestamp;});
      properties.image.images.forEach(function(obj) {
        obj.isImage=true;
      });
      //Finish Light Objects
      properties.image.lightData.sort(function(a, b) {return a.timestamp-b.timestamp;});
      //Make play object
      properties.image.lightData.forEach(function(obj) {obj.isImage=false;});
      //Add as sequence and sort
      this.imageLightData=properties.image.images;
      this.imageLightData.forEach(function(item) {item.isImage=true;});
      this.imageLightData=this.imageLightData.concat(properties.image.lightData);
      this.imageLightData.sort(function(a, b) {return a.timestamp-b.timestamp;});

      var tempLightData=properties.image.lightData;
      //Create Slider light Data
      for(var j=0;j<properties.image.images.length;j++) {
        var img=properties.image.images[j];
        //Before First light data: set to zero
        if(tempLightData[0].timestamp>img.timestamp) {
          img.lightData=[0, 0, 0, 0];
        } else {
          //Serach for light data before image
          var lastData=tempLightData[0];
          for(var i=0;i<tempLightData.length;i++) {
            var diff=tempLightData[i].timestamp-img.timestamp;
            if(diff>0) {
              img.lightData=[lastData.led1,lastData.led2,lastData.led3,lastData.led4];
              break;
            }
            lastData=tempLightData[i];
          }
          if(img.lightData===undefined || img.lightData===undefined) {
            img.lightData=[0, 0, 0, 0];
          }
        }
      }
      this.setLightData(0, 0, 0, 0);
    }
  }
  this.playImageLightData=this.imageLightData.slice(0);
  this.playImageLightData.sort(function(a, b) {return a.timestamp-b.timestamp;});
  this.playtime=this.playImageLightData[0].frameTime;;
};


//Update
//Update
//Update
//Update
MicroscopeView.prototype.updateForPlaying=function(dt, stopPlay) {
  this.playtime+=dt;
  var didChangeImage=false;
  if(this.playImageLightData.length>0 && !stopPlay) {
    if(this.playtime>=this.playImageLightData[0].frameTime) {
      var playEvent=this.playImageLightData.shift();
      if(playEvent.isImage) {
        this.imageCounter++;
        if(this.imageCounter>=5) {
          this.imageCounter=0;
          didChangeImage=true;
        }
        this.playImageFrame=playEvent.frameNumber;
        this.playImageTime=playEvent.frameTime;
        this.loadNewImage(playEvent.path, playEvent.timestamp, 'updateForPlaying');
        if(this.newPath) {this.newPath.setHighlightPoint(playEvent.frameNumber);}
        var sec=Number(playEvent.frameTime)/1000;
        document.getElementById('txtboxFrame').value='Frame: '+playEvent.frameNumber;
        document.getElementById('txtboxTime').value='Time: '+sec+' seconds';
      } else {
        this.setLightData(playEvent.led1, playEvent.led2, playEvent.led3, playEvent.led4);
      }
    }
    return {isStillPlaying:true, didChangeImage:didChangeImage, playImageFrame:this.playImageFrame, playImageTime:this.playImageTime};
  } else {return {isStillPlaying:false, didChangeImage:didChangeImage};}
};

//Lights
//Lights
//Lights
//Lights
MicroscopeView.prototype.setLightData=function(led1, led2, led3, led4) {
  this.lightValues={
    led1:led1, led2:led2, led3:led3, led4:led4,
    top:led1, right:led2, bottom:led3, left:led4
  };
  this.lights.setOpacity(led1, led2, led3, led4);

  $("#topLabel").text(Math.round(led1*100/255));
  $("#rightLabel").text(Math.round(led2*100/255));
  $("#bottomLabel").text(Math.round(led3*100/255));
  $("#leftLabel").text(Math.round(led4*100/255));
};

//Images
//Images
//Images
//Images
MicroscopeView.prototype.updateForImageChange=function(imageFrameNumber) {
  var self=this;
  self.currentImage=null;
  for(var i=0;i<self.properties.image.images.length;i++) {
    if(Number(self.properties.image.images[i].frameNumber)===Number(imageFrameNumber)) {
      self.currentImage=self.properties.image.images[i];
      break;
    }
  }
  if(self.currentImage) {
    var activeLightData=self.properties.image.lightData[imageFrameNumber];
    self.currentImageFrame=self.currentImage.frameNumber;
    self.currentImageTime=self.currentImage.frameTime;
    self.setLightData(self.currentImage.lightData[0], self.currentImage.lightData[1], self.currentImage.lightData[2], self.currentImage.lightData[3]);
    self.loadNewImage(self.currentImage.path, self.currentImage.timestamp, 'updateForImageChange');
    if(self.newPath) {self.newPath.setHighlightPoint(self.currentImageFrame);}
  }
};
MicroscopeView.prototype.loadNewImage=function(path, timestamp, from) {
  var me=this;
  if(me.loadedImages[timestamp]) {
    if(me.backgroundImage) {me.remove(me.backgroundImage);}
    me.backgroundImage=me.loadedImages[timestamp];
    me.add(me.backgroundImage);
  } else {
    var l_imageLoaded=function (dat) {
      //Remove Old Image
      if(me.backgroundImage) {me.remove(me.backgroundImage);}
      //Create new Background Image
      var material=new THREE.MeshBasicMaterial({color:0xffffff, map:texture});
      me.backgroundImage=new Mesh_Image(path, texture, material, false, me.width, me.height, '');
      me.loadedImages[timestamp]=me.backgroundImage;
      me.add(me.backgroundImage);
    };
    var l_imageLoadedErr=function(err) {
      console.log('loadImage ERROR: ', err);
    };
    //Load Texture
    var texture=THREE.ImageUtils.loadTexture(path, THREE.UVMapping, l_imageLoaded, l_imageLoadedErr);
    texture.minFilter=texture.magFilter=THREE.LinearFilter;
  }
};

//SetPaths
//SetPaths
//SetPaths
//SetPaths
//SetPaths
MicroscopeView.prototype.createNewStaticPath=function(props) {
  var self=this;
  props.color=self.PathColors[props.color].normal;
  props.highlightColor=self.PathColors[props.highlightColor].highlight;
  this.staticPath=new MyPath(props);
  this.staticPath.toggleHighlight(false);
  props.points.forEach(function(pt) {
    self.addPointToStaticPath({x:pt.x, y:pt.y}, pt.frameNumber);
  });
};
MicroscopeView.prototype.addPointToStaticPath=function(point, frameNumber) {
  for(var i=0;i<this.staticPath.points.length;i++) {
    var checkPoint=this.staticPath.points[i];

    //console.log(checkPoint)
    if(checkPoint.frameNumber==frameNumber) {
      this.staticPath.points.splice(i, 1);
      this.remove(checkPoint);
      break;
    };
  };
  var newPoint=this.staticPath.addPoint(point);
  newPoint.frameNumber=frameNumber;
  this.add(newPoint);
  //this.staticPath.setHighlightPoint(this.currentImageFrame);
};
MicroscopeView.prototype.createNewSetPath=function(props) {
  var self=this;
  props.color=self.PathColors[props.color].normal;
  props.highlightColor=self.PathColors[props.highlightColor].highlight;
  this.newPath=new MyPath(props);
  this.newPath.toggleHighlight(false);
};
MicroscopeView.prototype.removePointFromPath=function(frameNumber) {
  for(var i=0;i<this.newPath.points.length;i++) {
    var checkPoint=this.newPath.points[i];
    if(checkPoint.frameNumber==frameNumber) {
      this.newPath.points.splice(i, 1);
      this.remove(checkPoint);
      break;
    };
  };
};
MicroscopeView.prototype.addPointToPath=function(point, frameNumber) {
  for(var i=0;i<this.newPath.points.length;i++) {
    var checkPoint=this.newPath.points[i];
    if(checkPoint.frameNumber==frameNumber) {
      this.newPath.points.splice(i, 1);
      this.remove(checkPoint);
      break;
    };
  };
  var newPoint=this.newPath.addPoint(point);
  newPoint.frameNumber=frameNumber;
  this.add(newPoint);
  //this.newPath.setHighlightPoint(this.currentImageFrame);
};
MicroscopeView.prototype.setHighlightPoint=function(imageFrameNumber) {
  if(this.newPath!==null && this.newPath!==undefined) {
    //this.newPath.setHighlightPoint(imageFrameNumber);
  }
};
MicroscopeView.prototype.clearNewPath=function() {
  if(this.newPath!==null && this.newPath!==undefined) {
    for(var i=0;i<this.newPath.points.length;i++) {
      var point=this.newPath.points[i];
      this.remove(point);
    }
    this.newPath=null;
  }
};
MicroscopeView.prototype.getNewPathPoints=function() {
  var retPoints=[];
  for(var i=0;i<this.newPath.points.length;i++) {
    var pt={
      x:this.newPath.points[i].position.x,
      y:this.newPath.points[i].position.y,
      frameNumber:this.newPath.points[i].frameNumber,
    };
    retPoints.push(pt);
  }
  return retPoints;
};

//Mouse Hover
//Mouse Hover
//Mouse Hover
//Mouse Hover
MicroscopeView.prototype.clearMousePoint=function() {
  this.mouseHover.toggleVisible(false);
};
MicroscopeView.prototype.setMousePoint=function(mousePosition) {
  this.mouseHover.toggleVisible(true);
  if(this.mouseHover!==null && this.mouseHover!==undefined) {
    this.mouseHover.setPosition({
      x:mousePosition.x+this.mouseHoverSize,
      y:mousePosition.y+this.mouseHoverSize,
      z:this.mouseHover.position.z
    });
  }
};

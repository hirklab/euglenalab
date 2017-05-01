MyTrackingView=function(app, threeDiv, callback)
{
  var imageSetsPath=app.mainView.account.attributes.modelImageSetPath;
  var imageset=app.mainView.imageset;

  //THREE//Properties
  this.backgroundImage=null;
  this.threeBackgroundColor=0xffffff;
  this.container=threeDiv;
  this.isOrthographic=true;

  //THREE//Renderer
  this.renderer=new THREE.WebGLRenderer({alpha:true, antialias:true});
  this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  this.renderer.setClearColor(this.threeBackgroundColor);
  this.container.appendChild(this.renderer.domElement);
  this.container.hoverOffset={x:12, y:-12};
  //THREE//Scene
  this.scene=new THREE.Scene();
  this.scene.add(new THREE.AmbientLight(0xffffff));
  //THREE//Camera
  var near=1;
  var far=5000;
  var border=0;
  if(this.isOrthographic) {
    this.camera=new THREE.OrthographicCamera(
        -1*this.container.clientWidth*0.500, this.container.clientWidth*0.500,
        this.container.clientHeight*0.500, -1*this.container.clientHeight*0.500, near, far);
  } else {
    var ratio=gridWidth/gridHeight;
    var fov=45;
    this.camera=new THREE.PerspectiveCamera(fov, ratio, near, far);
  }
  this.camera.position.x=0;
  this.camera.position.y=-8;
  this.camera.position.z=1650;

  //View Touch Plane
  this.clickMesh=new THREE.Mesh(
    new THREE.PlaneGeometry((this.camera.right - this.camera.left), (this.camera.top - this.camera.bottom)),
    new THREE.MeshBasicMaterial({color:this.threeBackgroundColor})
  );
  this.clickMesh.name='clickMesh';
  this.clickMesh.visible=true;
  this.clickMesh.position=new THREE.Vector3(0, 0, 0);
  this.scene.add(this.clickMesh);
  this.wasSliderCreated=false;
  this.touchHelper={
    point:new THREE.Vector3(0, 0, 0), raycaster:new THREE.Raycaster(), projector:new THREE.Projector(),
  };
  //Euglena
  var size={x:20, y:5, z:5};
  var position={x:0, y:0, z:10};
  var rotation={x:0, y:0, z:0.1};
  var dynamics={surge:30, roll:4, pitch:1, yaw:1};
  if(app.editorView) {
    size={x:app.editorView.model.get('length'), y:app.editorView.model.get('diameter'), z:app.editorView.model.get('diameter')};
    position={x:app.editorView.model.get('x'), y:app.editorView.model.get('y'), z:10};
    rotation={x:0, y:0, z:app.editorView.model.get('zRot')};
    dynamics={surge:app.editorView.model.get('surge'), roll:app.editorView.model.get('roll'), pitch:app.editorView.model.get('pitch')[0], yaw:app.editorView.model.get('pitch')[0]};
  }
  this.euglena=new Euglena(size, position, rotation, dynamics, this.inertialAxes);
  this.scene.add(this.euglena);

  this.imageSetsPath=imageSetsPath;
  this.imageset=imageset;
  this.resetData();
  this.initialPlay=false;
  this.doStopPlay=false;
  this.doReset=true;
  this.startPlay=false;
  this.runData=[];
  this.addEugPointsTimer=0;
  this.frameCounter=0;
  this.eugUpdateCnt=0;
  this.eugUpdateInt=50;
  setTimeout(function() {callback();}, 200);
  return this;
};
MyTrackingView.prototype=Object.create(Object.prototype);
MyTrackingView.prototype.setEuglenaParameters=function() {
  var size={x:20, y:5, z:5};
  var position={x:0, y:0, z:10};
  var rotation={x:0, y:0, z:0.1};
  var dynamics={surge:30, roll:4, pitch:1, yaw:1};
  var modelCase=1;
  if(app.editorView) {
    size={x:app.editorView.model.get('length'), y:app.editorView.model.get('diameter'), z:app.editorView.model.get('diameter')};
    position={x:app.editorView.model.get('x'), y:app.editorView.model.get('y'), z:10};
    rotation={x:0, y:0, z:app.editorView.model.get('zRot')};
    dynamics={surge:app.editorView.model.get('surge'), roll:app.editorView.model.get('roll'),
      pitch:app.editorView.model.get('pitch')[0], yaw:app.editorView.model.get('yaw')[0],
      coupling:app.editorView.model.get('coupling')
    };
    modelCase=app.editorView.model.get('modelCase');
  }


  this.euglena.setSize(size.x, size.y, size.z);
  this.euglena.setPosition(position.x, position.y, 100);
  this.euglena.setRotation(0, 0, rotation.z);
  this.euglena.setDynamics(dynamics.surge, dynamics.roll, dynamics.pitch, dynamics.yaw, dynamics.coupling, modelCase);
};
MyTrackingView.prototype.resetData=function() {
  var imageSetsPath=this.imageSetsPath;
  var imageset=this.imageset;
  //var title=document.getElementById('MainHeader').innerHTML;
  title='Images from '+imageset.attributes.displayName;
  // document.getElementById('MainHeader').innerHTML=title;
  var frameNumber=imageset.attributes.activeImage.frameNumber;
  var micViewProps={
    name:'microscopeView',
    size:{width:640, height:480},
    background:{color:0xd3d3d3, opacity:1.0},
    image:{hasImage:true,
      basePath:imageSetsPath,
      activeImage:imageset.attributes.activeImage,
      images:imageset.attributes.images,
      lightData:imageset.attributes.lightData},
    light:{hasLight:true, lightSize:30, allOn:false},
    grid:{hasGrid:true, boxSize:14, isVisible:true},
  };
  if(this.micView) {
    this.micView.resetData(micViewProps);
    this.currentImageFrame=frameNumber;
  } else {
    this.micView=new MicroscopeView(micViewProps);
    this.micView.position.y=this.container.offsetTop;
    this.scene.add(this.micView);
    this.currentImageFrame=frameNumber;
    this.addStaticPath(app.mainView.setpath.attributes.pathName, app.mainView.setpath.attributes.points);
  }
  this.setEuglenaParameters();
  this.setImageFrame(frameNumber, 'view resetData');
  this.hasUpdate=false;
  this.isUpdateControlClick=false;
  this.controlClick='';
  this.updateObject={state:'viewing'};
  this.currentTime=0;
  this.state=0;
  this.doStopPlay=false;
  this.doReset=true;
  this.startPlay=false;
  this.runData=[];
  this.eugUpdateCnt=0;
  this.eugUpdateInt=50;
  this.removePath();
  this.createNewSetPath('run');

  var obj={
    name:'MyTrackingView:'+app.mainView.serverTab+':resetData', time:new Date().getTime(),
    imageSetsPath:imageSetsPath,
    imagesetId:imageset._id,
    currentImageFrame:this.currentImageFrame,
  }
};
//Update
MyTrackingView.prototype.animate=function(dt) {
  var width=this.container.clientWidth;
  var height=this.container.clientHeight;
  if(this.initialPlay) {
    this.initialPlay=this.micView.updateForPlaying(dt, this.doStopPlay);
    if(!this.initialPlay) {this.resetData();}
  } else if(this.startPlay) {
    //Update mic images and lights
    var retObj=this.micView.updateForPlaying(dt, this.doStopPlay);
    this.startPlay=retObj.isStillPlaying;
    //Move Euglena with light

    this.eugUpdateCnt+=dt;
    var runData={};
    if(this.eugUpdateCnt>=this.eugUpdateInt) {
      this.eugUpdateCnt=0;
      runData=this.euglena.update(
        this.micView.lightValues.left,
        this.micView.lightValues.right,
        this.micView.lightValues.top,
        this.micView.lightValues.bottom
      );
    }
    runData.lights=this.micView.lightValues;
    var vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.euglena.matrixWorld);
    runData.eugPosition=vector;
    this.runData.push(runData);
    if(retObj.didChangeImage) {
      this.addPointToPath({x:vector.x, y:vector.y}, retObj.playImageFrame);
    }
    //Add euglena point
    if(!this.startPlay) {
      app.mainView.updateFromViewCallback(this.runData);
    }
  }
  //Update Three
  //Camera-Keep a certain distance above euglena.
  if(!this.isOrthographic) {this.camera.aspect=width/height;}
  this.camera.updateProjectionMatrix();
  //Renderer
  this.renderer.setViewport(0, 0, width, height);
  this.renderer.setScissor(0, 0, width, height);
  this.renderer.enableScissorTest(true);
  this.renderer.setClearColor(this.threeBackgroundColor);
  this.renderer.render(this.scene, this.camera);
};

//Set/Get Image Data
MyTrackingView.prototype.setImageFrame=function(frameNumber, callerName) {
  var imageInfo=this.micView.updateForImageChange(frameNumber);
  var sec=Number(this.micView.currentImageTime)/1000;
  document.getElementById('txtboxFrame').value='Frame: '+frameNumber;
  document.getElementById('txtboxTime').value='Time: '+sec+' seconds';
};
MyTrackingView.prototype.getImageFrame=function() {
  return this.micView.currentImageFrame;
};
MyTrackingView.prototype.getImageTime=function() {
  return this.micView.currentImageTime;
};

//Path Events
MyTrackingView.prototype.createNewSetPath=function(name) {
  this.micView.createNewSetPath({
    name:name, index:0, type:'x', size:6,
    color:1, highlightColor:1,
    points:[], id:new Date().getTime(),
  });
};
MyTrackingView.prototype.removePointFromPath=function() {
  this.micView.removePointFromPath(this.micView.currentImageFrame);
};
MyTrackingView.prototype.addPointToPath=function(point, imageFrame) {
  this.micView.addPointToPath(point, imageFrame);
};
MyTrackingView.prototype.removePath=function() {
  this.micView.clearNewPath();
};
MyTrackingView.prototype.addPath=function(name, points) {
  this.removePath();
  this.micView.createNewSetPath({
    name:name, index:0, type:'x', size:6,
    color:0, highlightColor:0,
    points:[], id:new Date().getTime(),
  });
  var self=this;
  points.forEach(function(pt) {
    self.addPointToPath({x:pt.x, y:pt.y}, pt.frameNumber);
  });
};
MyTrackingView.prototype.addStaticPath=function(name, points) {
  this.micView.createNewStaticPath({
    name:name, index:0, type:'b', size:6,
    color:0, highlightColor:0,
    points:points, id:new Date().getTime(),
  });
};
//Mouse Events
//Mouse Events
//Mouse Events
//Mouse Events
MyTrackingView.prototype.addMouseMoveEvent=function() {
  var self=this;
  if(self.micView) {
    self.container.addEventListener('mousemove', function(e) {
      e.preventDefault();
      var threePoint=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, self.clickMesh);
      if(threePoint) {
        self.micView.setMousePoint(threePoint);
      }
    }, false);
  }
};
MyTrackingView.prototype.addMouseOutEvent=function() {
  var self=this;
  if(self.micView) {
    self.container.addEventListener('mouseout', function(e) {
      e.preventDefault();
    }, false);
  }
};

MyTrackingView.prototype.toggleClickOn=false;
MyTrackingView.prototype.toggleClickEvent=function(toggleOn) {
  var self=this;
  self.toggleClickOn=toggleOn;
  function handleEvent(e) {
    var threePoint=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, self.clickMesh);
    if(threePoint) {
      if(self.initialPlay || self.startPlay) {self.doStopPlay=true;self.doReset=true;}
      else if(app.editorView && app.editorView.state=='newpath' || app.editorView.state=='editpath') {
        self.addPointToPath(threePoint, self.micView.currentImageFrame);
        var num=self.micView.currentImageFrame;
        var time=self.micView.currentImageTime;
        var x=Math.round(threePoint.x*1000)/1000;
        var y=Math.round(threePoint.y*1000)/1000;
        //var displayName=num+':('+data.x+', '+data.y+')';
        var displayName=num+':('+x+', '+y+')';
        app.editorView.addPointToNewPath({
          displayName:displayName, frameNumber:num, frameTime:time,
          filename:self.micView.currentImage.filename, timestamp:self.micView.currentImage.timestamp,
          x:x, y:y,
        });
      }
    }
    e.preventDefault();
  };
  if(toggleOn) {self.container.onclick=handleEvent}
  else {self.container.onclick=null;}
};
MyTrackingView.prototype.toggleDownOn=false;
MyTrackingView.prototype.toggleDownEvent=function(toggleOn) {
  var self=this;
  var eventName='mousedown';
  self.toggleDownOn=toggleOn;
  function handleEvent(e) {
    if(self.toggleDownOn) {
      var threePointRot=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, self.ruler.circleMesh);
      if(threePointRot!==null && self.ruler.imageMesh.visible) {
        if(!self.isClickHoldingRulerRot) {
          self.isClickHoldingRulerRot=true;
          self.touchHelper.mouse2D=threePointRot;
        }
      } else {
        var threePointRul=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, self.ruler.imageMesh);
        if(threePointRul!==null && self.ruler.imageMesh.visible) {
          if(!self.isClickHoldingRuler) {
            self.isClickHoldingRuler=true;
            self.touchHelper.mouse2D=threePointRul;
          }
        } else {
          self.controls.buttons.forEach(function(item) {
            var obj=self.controls[item];
            if(obj.button.imageMesh.visible) {
              var threePoint=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, obj.button.imageMesh);
              if(threePoint!==null) {
                obj.button.resizeForDown();
              }
            }
          });
        }
      }
    }
  };
  if(toggleOn) {self.container.addEventListener(eventName, handleEvent)}
  else {self.container.removeEventListener(eventName, handleEvent)}
};
MyTrackingView.prototype.toggleUpOn=false;
MyTrackingView.prototype.toggleUpEvent=function(toggleOn) {
  var self=this;
  var eventName='mouseup';
  self.toggleUpOn=toggleOn;
  function handleEvent(e) {
    if(self.toggleUpOn) {
      var threePointRot=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, self.ruler.circleMesh);
      if(threePointRot!==null) {
        if(self.isClickHoldingRulerRot) {
          self.isClickHoldingRulerRot=false;
          self.isClickHoldingRuler=false;
        }
      } else {
        self.isClickHoldingRulerRot=false;
        var threePointRul=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, self.ruler.imageMesh);
        if(threePointRul!==null) {
          if(self.isClickHoldingRuler) {
            self.isClickHoldingRulerRot=false;
            self.isClickHoldingRuler=false;
          }
        } else {
          self.controls.buttons.forEach(function(item) {
            var obj=self.controls[item];
            if(obj.button.buttonState===obj.button.buttonStates.down) {
              var threePoint=self.threePointForTouchEvent({x:e.layerX, y:e.layerY-self.container.offsetTop}, obj.button.imageMesh);
              if(threePoint!==null) {
                obj.button.resizeForUp();
                self.hasUpdate=true;
                self.isUpdateControlClick=true;
                self.controlClick=item;
              }
            }
          });
        }
      }
    }
  };
  if(toggleOn) {self.container.addEventListener(eventName, handleEvent)}
  else {self.container.removeEventListener(eventName, handleEvent)}
};
MyTrackingView.prototype.toggleOutOn=false;
MyTrackingView.prototype.toggleOutEvent=function(toggleOn) {
  var self=this;
  var eventName='mouseout';
  self.toggleOutOn=toggleOn;
  function handleEvent(e) {
    if(self.toggleOutOn) {
      self.isClickHoldingRulerRot=false;
      self.isClickHoldingRuler=false;
      self.touchHelper.mouse2D=null;
      self.controls.buttons.forEach(function(item) {
        var obj=self.controls[item];
        if(obj.button && obj.button.imageMesh.visible) {
          obj.button.resizeForUp();
        }
      });
    }
  };
  if(toggleOn) {self.container.addEventListener(eventName, handleEvent)}
  else {self.container.removeEventListener(eventName, handleEvent)}
};
MyTrackingView.prototype.threePointForTouchEvent=function(touchPoint, intersectMesh) {
  this.touchHelper.point.x=(touchPoint.x/this.container.clientWidth)*2-1
  this.touchHelper.point.y=-(touchPoint.y/this.container.clientHeight)*2+1;
  this.touchHelper.point.z=0;
  this.touchHelper.raycaster=this.touchHelper.projector.pickingRay(this.touchHelper.point, this.camera);
  this.touchHelper.intersector=this.touchHelper.raycaster.intersectObject(intersectMesh);
  if(this.touchHelper.intersector.length>0) {
    return {x:this.touchHelper.intersector[0].point.x, y:this.touchHelper.intersector[0].point.y, z:2};
  }
  return null;
};

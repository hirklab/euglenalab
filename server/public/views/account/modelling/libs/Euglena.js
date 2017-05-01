Euglena=function(size, position, rotation, dynamics, inertialAxes) {
  THREE.Mesh.call(this);
  //Constants Parameters
  this.degToRads=Math.PI/180;
  this.radToDegs=180/Math.PI;
  //Initial SizeInput Size 
  this.initLength=size.x;
  this.initWidth=size.y;
  this.initHeight=size.z;
  //Inertial Axis Reference 
  this.inertialAxes=inertialAxes;
  //Create Local Axes
  this.localAxes=new THREE.AxisHelper(this.initLength*2.0);
  this.localAxes.position.set(this.position.x, this.position.y, this.position.z);
  this.add(this.localAxes);
  
  //Create Euglena Box
  this.length=this.initLength;
  this.width=this.initWidth;
  this.height=this.initHeight;
  this.position.set(position.x, position.y, position.z); 
  //Create Vertices
  this.geometry = new THREE.Geometry();
  this.geometry.vertices.push(new THREE.Vector3(this.length, 0, 0));		//0	
  this.geometry.vertices.push(new THREE.Vector3(this.length, this.width, 0));	//1
  this.geometry.vertices.push(new THREE.Vector3(this.length, 0, this.height));	//2
  this.geometry.vertices.push(new THREE.Vector3(this.length, this.width, this.height));	//3
  this.geometry.vertices.push(new THREE.Vector3(0, 0, 0));		//4
  this.geometry.vertices.push(new THREE.Vector3(0, 0, this.height));		//5
  this.geometry.vertices.push(new THREE.Vector3(0, this.width, 0));		//6
  this.geometry.vertices.push(new THREE.Vector3(0, this.width, this.height));	//7
  //Center in Body
  this.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-this.length*0.500, -this.width*0.500, -this.height*0.500));
  //Materials 
  var opacity=1.0;
  this.materials = [];	
  this.materials.push(new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, opacity:opacity, transparent:true}));
  this.materials.push(new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide, opacity:opacity, transparent:true}));
  this.materials.push(new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, opacity:opacity, transparent:true}));
  this.materials.push(new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, opacity:opacity, transparent:true}));
  this.materials.push(new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide, opacity:opacity, transparent:true}));
  this.materials.push(new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, opacity:opacity, transparent:true}));
  this.material = new THREE.MeshFaceMaterial(this.materials);
  //Make Faces 
  var color = new THREE.Color(0xff0000);
  function addFace(name, g, a, b, c, d, norm, color, iMatA, iMatD) {
    var face=new THREE.Face3(a, b, c, norm, color, iMatA);
    face.name=name;
    g.faces.push(face);
    face = new THREE.Face3(d, c, b, norm, color, iMatD);
    face.name = name;
    g.faces.push(face);	
  };
  addFace("front", this.geometry, 0, 1, 2, 3, new THREE.Vector3(1, 0, 0), color, 0, 0);
  addFace("back", this.geometry, 4, 5, 6, 7, new THREE.Vector3(-1, 0, 0), color, 1, 1);
  addFace("left", this.geometry, 1, 6, 3, 7, new THREE.Vector3(0, 1, 0), color, 2, 2);
  addFace("top", this.geometry, 3, 7, 2, 5, new THREE.Vector3(0, 0, 1), color, 3, 3);
  addFace("right", this.geometry, 4, 0, 5, 2, new THREE.Vector3(0, -1, 0), color, 4, 4);
  addFace("bottom", this.geometry, 4, 0, 6, 1, new THREE.Vector3(0, 0, -1), color, 5, 5);

  this.setRotation(rotation);

  //Dynamic Run Params
  this.surge={};   //Forward movement along euglena x axis
  this.roll={};     //
  this.pitch={};   //Not Used
  this.yaw={};       //Considered Turn Speed around z axis
  this.hasRoll=false;
  this.hasYaw=false;
  this.updateCounter=0;
  this.caseselect=0;
};

Euglena.prototype = Object.create(THREE.Mesh.prototype);
Euglena.prototype.setTest = function(parameters) {
 
  //Build Turn Quaternions 
  var turnQs=[];
  var rollFrames=2/parameters.rollPerFrame;
  var deltaRollAngle=Math.PI*parameters.rollPerFrame;
  for(var rollCounter=0;rollCounter<rollFrames;rollCounter++) {
    var q=new THREE.Quaternion();
    var v=new THREE.Vector3(0, Math.sin(deltaRollAngle*(rollCounter+1)), Math.cos(deltaRollAngle*(rollCounter+1)));
    q.setFromAxisAngle(v, parameters.turnPerFrame);
    turnQs.push({frame:rollCounter, q:q});
  }
  //Build Roll Quaternion
  var rollQ=new THREE.Quaternion(); 
  rollQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaRollAngle);
  //Test Run
  turnQs.sort(function(a, b) {return a.frame-b.frame;});
  var masterQ=new THREE.Quaternion();
  for(var i=0;i<2;i++) {
    masterQ.multiplyQuaternions(masterQ, rollQ);
    masterQ.multiplyQuaternions(masterQ, turnQs[i%rollFrames].q);
  }
  this.quaternion.multiplyQuaternions(this.quaternion, masterQ);
  this.updateMatrixWorld();
};
Euglena.prototype.setSize = function(x, y, z) {
  //Update Euglena Size
  this.scale.x=x/this.initLength;
  this.scale.y=y/this.initWidth;
  this.scale.z=z/this.initHeight;
};
Euglena.prototype.setPosition = function(x, y, z) {
  //Set Position
  this.position.x=Number(x);
  this.position.y=Number(y);
  this.position.z=Number(z);
};
Euglena.prototype.setRotation = function(x, y, z) {
  //Set Position
  this.rotation.x=Number(x*Math.PI);
  this.rotation.y=Number(y*Math.PI);
  this.rotation.z=Number(z*Math.PI);
};
Euglena.prototype.setDynamics = function(surge, roll, pitch, yaw, coupling, caseselect) {
  yaw=coupling;
  this.caseselect=Number(caseselect);
  //Dynamic Run Parameters 
  //this.pitch=pitch;   //Not Used
  this.surge={  //Forward movement along euglena x axis
    vector:new THREE.Vector3(1, 0, 0), //Euglena body Axis
    value:surge*0.05         //Value from ui
  };   
  this.roll={ 
    quaternion:new THREE.Quaternion(), 
    value:roll,                  //value from ui
    frames:1,
  };
  this.yaw={       //Considered Turn Speed around z axis
    quaternion:new THREE.Quaternion(),
    vector:new THREE.Vector3(), 
    value:yaw*0.0001,                  //value from ui
    rollCorrectionVectors:[],     //if roll is not zero then turn values are calculated for each possible for value
  };
  this.hasRoll=false;
  this.hasYaw=false;
  var originalRollValue=this.roll.value;
  if(this.roll.value>0) {
    this.hasRoll=true;
    var allowedRolls=[1, 0.5, 0.4, 0.25, 0.2, 0.08, 0.05, 0.04, 0.02, 0.01]
    roll=allowedRolls[0];
    for(var i=1;i<allowedRolls.length;i++) {
      if(this.roll.value==roll) {break;
      } else if(this.roll.value>roll) {break;
      } else {roll=allowedRolls[i];}
    }
    //EPS hack
    allowedRolls.sort(function(a, b) {return a-b;});
    roll=allowedRolls[originalRollValue-1];
    //EPS hack
    
    
    this.roll.value=Math.PI*roll;
    this.roll.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.roll.value);
    this.roll.frames=2/roll;
    for(var rollCounter=0;rollCounter<this.roll.frames;rollCounter++) {
      var v=new THREE.Vector3(0, Math.sin(this.roll.value*(rollCounter+1)), Math.cos(this.roll.value*(rollCounter+1)));
      this.yaw.rollCorrectionVectors.push({frame:rollCounter, vector:v});
    }
    this.yaw.rollCorrectionVectors.sort(function(a, b) {return a.frame-b.frame;});
  }
  if(this.hasRoll && Math.abs(this.yaw.value)>0) {
    this.hasYaw=true; 
    this.yaw.vector=new THREE.Vector3(0, 0, 1);
  } else if(Math.abs(this.yaw.value)>0) {
    this.hasYaw=true;
    this.yaw.vector=new THREE.Vector3(0, 0, 1);
  }  

  this.frame=0;
  this.updateCounter2=0;

  this.runDatas=[]; 
},
Euglena.prototype.update = function(leftIntensity, rightIntensity, topIntensity, bottomIntensity) {
  //if(leftIntensity>0) {leftIntensity=1;}
  //if(rightIntensity>0) {rightIntensity=1;}
  //if(topIntensity>0) {topIntensity=1;}
  //if(bottomIntensity>0) {bottomIntensity=1;}

//1
  //Run data is for saving the state this frame
  var runData={case:this.caseselect, posyFace:{}, negyFace:{}};   
  runData.light={left:leftIntensity, right:rightIntensity, top:topIntensity, bottom:bottomIntensity};
  runData.frame=this.frame;

   
//2
  //X Axis all four LIghts-decompose lights along euglena's x-y axis
  var vX=new THREE.Vector3(1, 0, 0);
  vX.applyQuaternion(this.quaternion);
  runData.atan2=Math.atan2(vX.y, vX.x);
  runData.sin=Math.sin(runData.atan2);
  runData.cos=Math.cos(runData.atan2);
  runData.xValue={
    left:leftIntensity*runData.sin, 
    right:-1*rightIntensity*runData.sin, 
    top:topIntensity*runData.cos,//sin(a + pi/2)=sin(a)cos(pi/2) + sin(pi/2)cos(a)=0+1*cos(a)
    bottom:-1*bottomIntensity*runData.cos
  };
  runData.x=runData.xValue.left+runData.xValue.right+runData.xValue.top+runData.xValue.bottom;

//3
  //Left Face All Four Lights-'adds' toghter the four possible lights hitting the left face from the outside. 
  runData.posyFace.value=0;
  var vY=new THREE.Vector3(0, 1, 0);
  vY.applyQuaternion(this.quaternion);
  runData.posyFace.left=0;
  if(leftIntensity>0) { 
    runData.posyFace.leftAngle=vY.angleTo(new THREE.Vector3(-1, 0, 0));
    runData.posyFace.leftValue=Math.cos(runData.posyFace.leftAngle)*leftIntensity;
    if(runData.posyFace.leftValue<0) {runData.posyFace.left=0;}
    else {runData.posyFace.left=runData.posyFace.leftValue;}
  }
  runData.posyFace.right=0;
  if(rightIntensity>0) { 
    runData.posyFace.rightAngle=vY.angleTo(new THREE.Vector3(1, 0, 0));
    runData.posyFace.rightValue=Math.cos(runData.posyFace.rightAngle)*rightIntensity;
    if(runData.posyFace.rightValue<0) {runData.posyFace.right=0;}
    else {runData.posyFace.right=runData.posyFace.rightValue;}
  }
  runData.posyFace.top=0;
  if(topIntensity>0) { 
    runData.posyFace.topAngle=vY.angleTo(new THREE.Vector3(0, 1, 0));
    runData.posyFace.topValue=Math.cos(runData.posyFace.topAngle)*topIntensity;
    if(runData.posyFace.topValue<0) {runData.posyFace.top=0;}
    else {runData.posyFace.top=runData.posyFace.topValue;}
  }

  runData.posyFace.bottom=0;
  if(bottomIntensity>0) { 
    runData.posyFace.bottomAngle=vY.angleTo(new THREE.Vector3(0, -1, 0));
    runData.posyFace.bottomValue=Math.cos(runData.posyFace.bottomAngle)*bottomIntensity;
    if(runData.posyFace.bottomValue<0) {runData.posyFace.bottom=0;}
    else {runData.posyFace.bottom=runData.posyFace.bottomValue;}
  }
  runData.posyFace.value=runData.posyFace.left+runData.posyFace.right+runData.posyFace.top+runData.posyFace.bottom;
    

//4
  //Right Face All Four Lights-'adds' toghter the four possible lights hitting the right face from the outside. 
  runData.negyFace.value=0;
  var vY=new THREE.Vector3(0, -1, 0);
  vY.applyQuaternion(this.quaternion);
  runData.negyFace.left=0;
  if(leftIntensity>0) { 
    runData.negyFace.left=Math.cos(vY.angleTo(new THREE.Vector3(-1, 0, 0)))*leftIntensity;
    if(runData.negyFace.left<0) {runData.negyFace.left=0;}
  }
  runData.negyFace.right=0;
  if(rightIntensity>0) { 
    runData.negyFace.right=Math.cos(vY.angleTo(new THREE.Vector3(1, 0, 0)))*rightIntensity;
    if(runData.negyFace.right<0) {runData.negyFace.right=0;}
  }
  runData.negyFace.top=0;
  if(topIntensity>0) { 
    runData.negyFace.top=Math.cos(vY.angleTo(new THREE.Vector3(0, 1, 0)))*topIntensity;
    if(runData.negyFace.top<0) {runData.negyFace.top=0;}
  }
  runData.negyFace.bottom=0;
  if(bottomIntensity>0) { 
    runData.negyFace.bottom=Math.cos(vY.angleTo(new THREE.Vector3(0, -1, 0)))*bottomIntensity;
    if(runData.negyFace.bottom<0) {runData.negyFace.bottom=0;}
  }
  runData.negyFace.value=runData.negyFace.left+runData.negyFace.right+runData.negyFace.top+runData.negyFace.bottom;
//5

 
//6 
  //Select the yaw and roll modifications depending on the model selected 
  //Select the yaw and roll modifications depending on the model selected 
  //Select the yaw and roll modifications depending on the model selected 
  switch(this.caseselect) {
    case 1:
      runData.yawMod=runData.x;
      this.hasRoll=false;
      break;
    case 2:
      runData.yawMod=(runData.posyFace.value-runData.negyFace.value);
      this.hasRoll=false;
      break;
    case 3:
      runData.yawMod=runData.posyFace.value;
      break;
    default:
      runData.yawMod=0;
      break;
  }
  //Save Run Data
  this.runDatas.push(runData);
//7
  //Surge the Euglena 
  this.translateOnAxis(this.surge.vector, this.surge.value);

  //Rotate and Roll Depending on input
  if(this.hasRoll && this.hasYaw) { 
    //Reset The Yaw Quaternion 
    this.yaw.quaternion=new THREE.Quaternion();
    
    //Set the new yaw Quaternion
    this.yaw.quaternion.setFromAxisAngle(this.yaw.rollCorrectionVectors[this.updateCounter%this.roll.frames].vector, runData.yawMod*this.yaw.value);

    //'Add' roll quaternion to euglena's quaternion
    this.quaternion.multiplyQuaternions(this.quaternion, this.roll.quaternion);
    //'Add' yaw quaternion to euglena's quaternion
    this.quaternion.multiplyQuaternions(this.quaternion, this.yaw.quaternion);

    //THREE call to update the euglena object
    this.updateMatrix();
    this.updateMatrixWorld();

  } else if(this.hasRoll) {
    //Matrix Multipling 
    this.quaternion.multiplyQuaternions(this.quaternion, this.roll.quaternion);
 
    //THREE call to update the euglena object
    this.updateMatrix();
    this.updateMatrixWorld();
  
  } else if(this.hasYaw) {
    
    //Reset The Yaw Quaternion 
    this.yaw.quaternion=new THREE.Quaternion();
    
    //Set the new yaw Quaternion
    this.yaw.quaternion.setFromAxisAngle(this.yaw.vector, runData.yawMod*this.yaw.value);
    
    //'Add' yaw quaternion to euglena's quaternion
    this.quaternion.multiplyQuaternions(this.quaternion, this.yaw.quaternion);
   
    //THREE call to update the euglena object
    this.updateMatrix();
    this.updateMatrixWorld();
  }
  this.frame++;
  return runData;
}

Mesh_Text=function(name, text, size) 
{
  THREE.Mesh.call(this);
  this.name=name;
  this.textMesh=null;
  this.textMeshName='mytextmesh';
  this.color=0x7ec0ee;
  this.size=size;
  
  this.fCreateText=function(name, text, color, size) {
    var textGeo = new THREE.TextGeometry( text, {
      size: size,
      height: 1,
      curveSegments: 16,

      font: 'optimer',
      weight: 'normal',
      style: 'normal',

      material: 0,
      extrudeMaterial:1, 
    });
    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();
    var frontMesh=new THREE.MeshPhongMaterial( { ambient:color, color:color, shading: THREE.FlatShading } );
    var sideMesh=new THREE.MeshPhongMaterial( { ambient:color, color:color, shading: THREE.SmoothShading } );
    var material = new THREE.MeshFaceMaterial([frontMesh, sideMesh]);
    var textMesh = new THREE.Mesh( textGeo, material );
    textMesh.position.x = 0;// -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );
    textMesh.position.y = 0;
    textMesh.position.z = 10;
    textMesh.name=name;
    return textMesh;
  }  

  var textMesh=this.fCreateText(this.textMeshName, text, this.color, this.size);
  this.add(textMesh); 
};

Mesh_Text.prototype = Object.create(THREE.Mesh.prototype);
Mesh_Text.prototype.setText = function(text) {
  for(var i=0;i<this.children.length;i++) {
    if(this.children[i].name=this.textMeshName) {
      this.remove(this.children[i]); 
      break;
    }
  };
  var textMesh=this.fCreateText(this.textMeshName, text, this.color, this.size);
  this.add(textMesh); 
};

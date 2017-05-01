var myThree = {
	renderer:null,
	scene:null,
	camera:null,
	properties:null,
	initialize: function(properties) {
		console.log('My Renderer Initialize');
		//Renderer
		this.renderer=new THREE.WebGLRenderer({antialias:properties.antialias});
		this.renderer.setSize(properties.width, properties.height);
		this.renderer.setClearColor(properties.clearColor);
		//Scene
		this.scene=new THREE.Scene();
		this.scene.add(new THREE.AmbientLight(properties.ambientLight));
		//Camera
		if(properties.isOrthographic) {
			this.camera=new THREE.OrthographicCamera(
				properties.left, properties.right, 
				properties.top, properties.bottom, 
				properties.near, properties.far
			);
		} else {
			this.camera=new THREE.PerspectiveCamera(
				properties.fov, properties.ratio, 
				properties.near, properties.far
			);
		}
		this.camera.position.x=properties.cameraX;
		this.camera.position.y=properties.cameraY;
		this.camera.position.z=properties.cameraZ;
		//Save Properties
		this.properties=properties;
	},
	resize: function(width, height) {
		//Camera
		this.camera.aspect=width/height;
		this.camera.updateProjectionMatrix();
		//Renderer
		this.renderer.setSize(width, height);
	},
	update: function(dt, width, height) {
		//Camera
		if(this.properties.isOrthographic) {
		} else {this.camera.aspect=width/height;}		
		this.camera.updateProjectionMatrix();
		//Renderer
		this.renderer.setViewport(0, 0, width, height);
		this.renderer.setScissor(0, 0, width, height);
		this.renderer.enableScissorTest(true);
		this.renderer.setClearColor(this.properties.clearColor);
		this.renderer.render(this.scene, this.camera);
	},
/*Utilities*/
	loadTexture: function(path, doLog, width, height, callback) {
		var cb_Loaded=function () {
			if(doLog) {console.log('three.loadImage SUCCESS: ', path);}
			var material=new THREE.MeshBasicMaterial({color:0xffffff, map:texture});
			var image=new Mesh_Image(path, texture, material, false, width, height);
			callback(image, null);
		};
		var cb_Err=function(err) {
			console.log('three.loadImage ERROR: ', err);
			callback(null, err);
		};
		//Load Texture
		if(doLog) {console.log('three.loadImage LOADING: ', path);}
		var texture=THREE.ImageUtils.loadTexture(path, THREE.UVMapping, cb_Loaded, cb_Err);
		texture.minFilter=texture.magFilter=THREE.LinearFilter;
	},
};

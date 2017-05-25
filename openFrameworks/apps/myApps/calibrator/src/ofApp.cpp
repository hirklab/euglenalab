#include "ofApp.h"
#include "ofAppGLFWWindow.h"

using namespace ofxCv;
using namespace cv;

//--------------------------------------------------------------
void ofApp::setup(){
    projectionX=312;
    projectionY=438;
    projectionZoom=0.263;
    projectionRotation=2.3;

    ofSetFullscreen(true);
    ofSetVerticalSync(true);
    ofSetFrameRate(PROJECTOR_FRAMERATE);
    ofEnableAlphaBlending();
    ofEnableSmoothing();
    ofSetCircleResolution(100);
    ofBackground(0,0,0);

    //we can now get back a list of devices.
    // vector<ofVideoDevice> devices = camera.listDevices();

    // for(unsigned int i = 0; i < devices.size(); i++){
    //     if(devices[i].bAvailable){
    //         ofLogNotice() << devices[i].id << ": " << devices[i].deviceName << " - available ";
    //     }else{
    //         ofLogNotice() << devices[i].id << ": " << devices[i].deviceName << " - unavailable ";
    //     }
    // }

    // videoInverted.allocate(camWidth, camHeight, OF_PIXELS_RGB);
    // videoTexture.allocate(videoInverted);
    // videoTexture.allocate(camWidth, camHeight, OF_PIXELS_RGB);
    
    // camera.setDeviceID(0);
    // camera.setDesiredFrameRate(CAMERA_FRAMERATE);
    // camera.initGrabber(CAMERA_WIDTH, CAMERA_HEIGHT);

    // imitate(undistorted, camera); //creates same buffer as camera
    // imitate(previous, camera);
    // imitate(diff, camera);

    // load calibration patterns
    // todo:

    // projection.allocate(PROJECTOR_WIDTH, PROJECTOR_HEIGHT, OF_PIXELS_RGB);
    
    //screen set to full mode - viewable area
    // viewportDisplay.set(0,0,DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // projection starts to right of viewable area
    // viewportProjector.set(DISPLAY_WIDTH,0,PROJECTOR_WIDTH,PROJECTOR_HEIGHT);

    lastTime=0;
    mode=PHASE0;

    // setup the server to listen on 32001
	TCP.setup(32001);
	// optionally set the delimiter to something else.  The delimiter in the client and the server have to be the same, default being [/TCP]
	TCP.setMessageDelimiter("\n");
	lastSent = 0;

    // fbo.allocate(ofGetWidth(), ofGetHeight(), OF_PIXELS_RGB);
}


//--------------------------------------------------------------
void ofApp::update(){
	ofBackground(0, 0, 0);

    // camera.update();

    // if(camera.isFrameNew()){
    	// ofPixels & pixels = camera.getPixels();
        // for(int i = 0; i < pixels.size(); i++){
        //     //invert the color of the pixel
        //     videoInverted[i] = 255 - pixels[i];
        // }
        //load the inverted pixels
        // projection.loadData(pixels);

        // Mat currentImage = toCv(camera);
        // Mat previousImage = toCv(previous);
        // Mat diffImage = toCv(diff);
        // absdiff(previousImage,currentImage, diffImage);
        // diffMean = mean(Mat(mean(diffImage)))[0]; // final mean of all pixels
        // currentImage.copyTo(previousImage);

        // float currentTime = ofGetElapsedTimef();

        // calibrationCamera.add(currentImage);
        // calibrationProjector.add(currentImage);
    // }
    // 
    uint64_t now = ofGetElapsedTimeMillis();
	if(now - lastSent >= 10){
		for(int i = 0; i < TCP.getLastID(); i++){
			if( !TCP.isClientConnected(i) ) continue;

			TCP.send(i, "hello client - you are connected on port - "+ofToString(TCP.getClientPort(i)) );
		}
		lastSent = now;
	}
}

//--------------------------------------------------------------
void ofApp::draw(){
	ofSetHexColor(0xffffff);
    // camera.draw(0, 0);
    drawProjection();

    // projection.draw(CAMERA_WIDTH+projectionX, projectionY, projectionWidth, projectionHeight);

	// stringstream intrinsicsProjector, intrinsicsCamera;
	// ofSetWindowPosition(0,0); 

	// ofViewport(viewportDisplay);
 //    glMatrixMode(GL_PROJECTION);
	// glLoadIdentity();
	// // glOrtho(0,viewportDisplay.width, viewportDisplay.height, 0);
 //    glMatrixMode(GL_MODELVIEW);
 //    glLoadIdentity();
    
 //    int posTextY=CAMERA_HEIGHT+20, posTextX=10;
    
 //    // Draw current acquired image:
 //    ofSetColor(255);
 //    camera.draw(0,0, CAMERA_WIDTH, CAMERA_HEIGHT);

    // calibrationCamera.draw(CAMERA_WIDTH, 0, CAMERA_WIDTH/2, CAMERA_HEIGHT/2);
    // calibrationProjector.draw(CAMERA_WIDTH, CAMERA_HEIGHT/2, CAMERA_WIDTH/2, CAMERA_HEIGHT/2);

	// fbo.begin();
    // ofSetHexColor(0xFF0000);
    // vidGrabber.draw(0, 0);
    // videoTexture.draw(camWidth, 0, camWidth, camHeight);
    // line.draw();
    // drawProjection();  
    // fbo.end();

    // ofSetColor(255);
    // fbo.draw(projectionWidth, 0, projectionWidth, projectionHeight);
    // 
    
    //***** PROJECTOR ******
    // ofViewport(viewportProjector);
    // glMatrixMode(GL_PROJECTION);
    // glLoadIdentity();
    // glOrtho(0,viewportProjector.width, viewportProjector.height, 0);
    // glMatrixMode(GL_MODELVIEW);
    // glLoadIdentity();

    // calibrationProjector.drawCandidateProjectorPattern(0,0, PROJECTOR_WIDTH, PROJECTOR_HEIGHT, ofColor(255,255,255,255), 6);
    
    // for each connected client lets get the data being sent and lets print it to the screen
	for(unsigned int i = 0; i < (unsigned int)TCP.getLastID(); i++){

		if( !TCP.isClientConnected(i) )continue;

		// give each client its own color
		ofSetColor(255 - i*30, 255 - i * 20, 100 + i*40);

		// calculate where to draw the text
		int xPos = 15;
		int yPos = 80 + (12 * i * 4);

		// get the ip and port of the client
		string port = ofToString( TCP.getClientPort(i) );
		string ip   = TCP.getClientIP(i);
		string info = "client "+ofToString(i)+" -connected from "+ip+" on port: "+port;


		// if we don't have a string allocated yet
		// lets create one
		if(i >= storeText.size() ){
			storeText.push_back( string() );
		}

		// receive all the available messages, separated by \n
		// and keep only the last one
        string str;
        string tmp;
        do{
            str = tmp;
            tmp = TCP.receive(i);
		}while(tmp!="");

		// if there was a message set it to the corresponding client
		if(str.length() > 0){
			storeText[i] = str;
		}

		// draw the info text and the received text bellow it
		// ofDrawBitmapString(info, xPos, yPos);
		// ofDrawBitmapString(storeText[i], 25, yPos + 20);
		// 
		ofLogNotice() << storeText[i];

	}
}

void ofApp::drawProjection(){
	glPushMatrix();

	glRotatef(projectionRotation,0,0,1);

	ofFill(); 
	ofSetColor(ofColor(255,0,0), 100);
    ofDrawRectangle(projectionX, projectionY, PROJECTOR_WIDTH*projectionZoom, PROJECTOR_HEIGHT*projectionZoom);

    glPopMatrix();
}


//--------------------------------------------------------------
void ofApp::keyPressed(int key){
    // in fullscreen mode, on a pc at least, the 
    // first time video settings the come up
    // they come up *under* the fullscreen window
    // use alt-tab to navigate to the settings
    // window. we are working on a fix for this...

    // Video settings no longer works in 10.7
    // You'll need to compile with the 10.6 SDK for this
    // For Xcode 4.4 and greater, see this forum post on instructions on installing the SDK
    // http://forum.openframeworks.cc/index.php?topic=10343
    // if(key == 's'){
    //     camera.videoSettings();
    // }

    if(key=='m'){
    	projectionZoom +=0.001;
    }

    if(key=='n'){
    	projectionZoom -=0.001;
    }

    if(key=='w'){
    	projectionY -=1;
    }

    if(key=='z'){
    	projectionY +=1;
    }

    if(key=='a'){
    	projectionX -=1;
    }

    if(key=='d'){
    	projectionX +=1;
    }

    if(key=='o'){
    	projectionRotation -=0.1;
    }

    if(key=='p'){
    	projectionRotation +=0.1;
    }

    ofLogNotice() << "{" <<projectionX << ", " << projectionY << ", "  << projectionZoom << ", "  << projectionRotation <<" deg}";
}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){
}

//--------------------------------------------------------------
void ofApp::mouseMoved(int x, int y){
	// ofLogNotice() << "Mouse: {" <<x << ", " << y << "}";
}

//--------------------------------------------------------------
void ofApp::mouseDragged(int x, int y, int button){
	// ofPoint pt;
    // pt.set(x,y);
    // line.addVertex(pt);
}

//--------------------------------------------------------------
void ofApp::mousePressed(int x, int y, int button){
}

//--------------------------------------------------------------
void ofApp::mouseReleased(int x, int y, int button){
	// line.clear();
}

//--------------------------------------------------------------
void ofApp::mouseEntered(int x, int y){
}

//--------------------------------------------------------------
void ofApp::mouseExited(int x, int y){
}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){
}

//--------------------------------------------------------------
void ofApp::gotMessage(ofMessage msg){
}

//--------------------------------------------------------------
void ofApp::dragEvent(ofDragInfo dragInfo){
}

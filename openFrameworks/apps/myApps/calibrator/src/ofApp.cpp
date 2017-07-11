#include "ofApp.h"
#include "ofAppGLFWWindow.h"

using namespace ofxCv;
using namespace cv;

//--------------------------------------------------------------
void ofApp::setup(){
    // 10X magnification for camera lens
    // posX=279;
    // posY=453;
    // posZ=0;

    // scaleX=0.034;
    // scaleY=0.054;
    // scaleZ=1.0;

    // rotX=-14.4;
    // rotY=1.2;
    // rotZ=2.9;

        // 4x magnification for camera lens
    posX=274.092;
    posY=479.405;
    posZ=0;

    scaleX=0.178;
    scaleY=0.233;
    scaleZ=1.0;

    rotX=181.502;
    rotY=-0.501;
    rotZ=-1.4;

    ofSetFullscreen(true);
    ofSetVerticalSync(true);
    ofSetFrameRate(PROJECTOR_FRAMERATE);
    // ofEnableAlphaBlending();
    // ofEnableSmoothing();
    ofSetCircleResolution(10);
    // ofBackground(0,0,0);

    //we can now get back a list of devices.
    // vector<ofVideoDevice> devices = camera.listDevices();

    // for(unsigned int i = 0; i < devices.size(); i++){
    //     if(devices[i].bAvailable){
    //         ofLogNotice() << devices[i].id << ": " << devices[i].deviceName << " - available ";
    //     }else{
    //         ofLogNotice() << devices[i].id << ": " << devices[i].deviceName << " - unavailable";
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
     mode=CALIBRATION;
     TCP.setup(PORT);
     TCP.setMessageDelimiter("\n");
     lastSent = 0;

     // originalCorners[0].set(0, 0);
     // originalCorners[1].set(640, 0);
     // originalCorners[2].set(640, 480);
     // originalCorners[3].set(0, 480);

     // distortedCorners[0].set(0, 0);
     // distortedCorners[1].set(100, 0);
     // distortedCorners[2].set(100, 100);
     // distortedCorners[3].set(0, 100);

     // homography = ofxHomography::findHomography(originalCorners, distortedCorners);

     // ofPoint point(320,240);

     // ofPoint pointInScreen = ofxHomography::toScreenCoordinates(point, homography);
     // ofLogNotice() << "Local coordinates " + ofToString(point) + "\nScreen coordinates " + ofToString(pointInScreen);

     // fbo.allocate(ofGetWidth(), ofGetHeight(), OF_PIXELS_RGB);
         //
         mesh.setMode(OF_PRIMITIVE_POINTS);
         mesh.enableColors();
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
  //    uint64_t now = ofGetElapsedTimeMillis();
         // if(now - lastSent >= 10){
         //      for(int i = 0; i < TCP.getLastID(); i++){
         //              if( !TCP.isClientConnected(i) ) continue;

         //              // ofLogNotice() << "connected on port " + ofToString(TCP.getClientPort(i));
         //      }

         //      lastSent = now;
         // }
 }

     //--------------------------------------------------------------
     void ofApp::draw(){
             // ofSetHexColor(0xffffff);
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

         // calibrationProjector.drawCandidateProjectorPattern(0,0, PROJECTOR_WIDTH, PROJECTOR_HEIGHT,
     ofColor(255,255,255,255), 6);

     // for each connected client lets get the data being sent and lets print it to the screen
//     ofLogNotice() << TCP.getLastID();

    for(unsigned int i = 0; i <= (unsigned int)TCP.getLastID(); i++){

        if( !TCP.isClientConnected(i) ){
            ofLogNotice() << "not connected";
            continue;
        }
        // give each client its own color
        // ofSetColor(255 - i*30, 255 - i * 20, 100 + i*40);

        // calculate where to draw the text
        // int xPos = 15;
        // int yPos = 80 + (12 * i * 4);

        // get the ip and port of the client
        // string port = ofToString( TCP.getClientPort(i) );
        // string ip   = TCP.getClientIP(i);
        // string info = "client "+ofToString(i)+" -connected from "+ip+" on port: "+port;


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

        ofLogNotice() << str;

        // if there was a message set it to the corresponding client
        if(str.length() > 0){

            // draw the info text and the received text bellow it
            // ofDrawBitmapString(info, xPos, yPos);
            // ofDrawBitmapString(storeText[i], 25, yPos + 20);
            //
            //

            bool parsingSuccessful = response.parse(str);

            if (parsingSuccessful)
            {
                // ofLogNotice() << response.getRawString();
                int x = (int)(response["x"].asDouble());
                int y = (int)(response["y"].asDouble());
                int clear = (int)(response["clear"].asDouble());

                if(x>=0 && y >= 0){
                        ofPoint pt;
                        pt.set(x,y);
                        mesh.addVertex(pt);
                        mesh.addColor(ofFloatColor(0.0, 0.0, 1.0)); // Blue
                }

                if(clear>0){
                        mesh.clear();
                }
            }

        }
    }

    drawLine();
}

void ofApp::drawProjection(){
    glPushMatrix();

    // ofMultMatrix(homography);

    glTranslatef(posX,posY,posZ);
    glRotatef(rotX,1,0,0);
    glRotatef(rotY,0,1,0);
    glRotatef(rotZ,0,0,1);
    glScalef(scaleX, scaleY, scaleZ);

    // ofFill();
    ofNoFill();
    ofSetColor(ofColor(255,255,255), 100);
    ofDrawRectangle(0, 0, 640, 480);

    // path.setFillColor(ofColor::red);
        // path.rectangle(0, 0, 640, 480);
        // path.rectangle(20, 20, 620, 460);

    glPopMatrix();
}

void ofApp::drawPoint(int x,int y){
    glPushMatrix();
    // ofMultMatrix(homography);

    glTranslatef(posX,posY,posZ);
    glRotatef(rotX,1,0,0);
    glRotatef(rotY,0,1,0);
    glRotatef(rotZ,0,0,1);
    glScalef(scaleX, scaleY, scaleZ);

    // ofFill();
    ofNoFill();
    ofSetColor(ofColor(0,0,255), 100);
    ofDrawRectangle(x, y, 1, 1);

        // path.setFillColor(ofColor::red);
            // path.rectangle(0, 0, 640, 480);
            // path.rectangle(20, 20, 620, 460);

    glPopMatrix();
}

void ofApp::drawLine(){
    glPushMatrix();

    // ofMultMatrix(homography);

    glTranslatef(posX,posY,posZ);
    glRotatef(rotX,1,0,0);
    glRotatef(rotY,0,1,0);
    glRotatef(rotZ,0,0,1);
    glScalef(scaleX, scaleY, scaleZ);

    // ofFill();
    ofNoFill();
    // ofSetColor(ofColor(0,0,255), 100);

    mesh.draw();

    glPopMatrix();
}


//--------------------------------------------------------------
void ofApp::keyPressed(int key){
    if(key=='m'){
        scaleX +=0.001;
    }

    if(key=='n'){
        scaleX -=0.001;
    }

    if(key=='l'){
        scaleY +=0.001;
    }

    if(key=='k'){
        scaleY -=0.001;
    }



    if(key=='w'){
        // projectionY +=1;
        posY +=0.1;
    }

    if(key=='z'){
        // projectionY +=1;
        posY -=0.1;
    }

    if(key=='a'){
        // projectionX -=1;
        posX -=0.1;
    }

    if(key=='d'){
        // projectionX +=1;
        posX +=0.1;
    }



    if(key=='t'){
        // projectionRotation -=0.1;
        rotX -=0.1;
    }

    if(key=='y'){
        rotX +=0.1;
    }

    if(key=='u'){
        // projectionRotation -=0.1;
        rotY -=0.1;
    }

    if(key=='i'){
        rotY +=0.1;
    }

     if(key=='o'){
        // projectionRotation -=0.1;
        rotZ -=0.1;
     }

    if(key=='p'){
        rotZ +=0.1;
    }

    ofLogNotice() << "==========================";
    ofLogNotice() << "{" <<posX << ", " << posY << ", "  << posZ << "}";
    ofLogNotice() << "{" <<scaleX << ", " << scaleY << ", "  << scaleZ << "}";
    ofLogNotice() << "{" <<rotX << ", " << rotY << ", "  << rotZ << "}";
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
//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){
}

//--------------------------------------------------------------
void ofApp::gotMessage(ofMessage msg){
}

//--------------------------------------------------------------
void ofApp::dragEvent(ofDragInfo dragInfo){
}




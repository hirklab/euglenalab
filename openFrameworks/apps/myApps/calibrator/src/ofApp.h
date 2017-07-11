#pragma once

#include "ofMain.h"
#include "ofxCv.h"
#include "ofxNetwork.h"
// #include "ofxHomography.h"
#include "ofxJSON.h"

#define DISPLAY_WIDTH 640
#define DISPLAY_HEIGHT 480

#define PROJECTOR_WIDTH 100
#define PROJECTOR_HEIGHT 75
#define PROJECTOR_FRAMERATE 5

#define CAMERA_WIDTH 640
#define CAMERA_HEIGHT 480
#define CAMERA_FRAMERATE 30

#define PORT 32001

enum Mode {CALIBRATION, TEST, PRODUCTION};

class ofApp : public ofBaseApp{

    public:

        void setup();
        void update();
        void draw();

        void drawProjection();
        void drawPoint(int x, int y);
        void drawLine();

        void keyPressed(int key);
        void keyReleased(int key);

        void mouseMoved(int x, int y);
        void mouseDragged(int x, int y, int button);
        void mousePressed(int x, int y, int button);
        void mouseReleased(int x, int y, int button);
        void mouseEntered(int x, int y);
        void mouseExited(int x, int y);

        void windowResized(int w, int h);
        void dragEvent(ofDragInfo dragInfo);

        void gotMessage(ofMessage msg);
        ofVideoGrabber camera;

        ofImage undistorted;

        ofPixels previous;
        ofPixels diff;
        float diffMean;

        float lastTime;

        ofTexture projection;

        ofPolyline line;
        // ofFbo fbo;

        // ofRectangle viewportDisplay;
        // ofRectangle viewportProjector;

        // ofxCv::Calibration calibrationCamera;
        // ofxCv::Calibration calibrationProjector;

        Mode mode;

        ofMatrix4x4 m;

        // cv::Mat rotateCamToProjector;
        // cv::Mat translateCamToProjector;
        string extrinsics;

        // int cameraWidth;
        // int cameraHeight;

        // float projectionZoom;

        // int projectionX;
        // int projectionY;

        // int projectionWidth;
        // int projectionHeight;

        // float projectionRotation;

        float posX;
        float posY;
        float posZ;

        float scaleX;
        float scaleY;
        float scaleZ=1.0;

        float rotX;
        float rotY;
        float rotZ;

        ofPath path;
        ofMesh mesh;

        ofxTCPServer TCP;
        ofxJSONElement response;

        // ofTrueTypeFont  mono;
        // ofTrueTypeFont  monosm;

        vector <string> storeText;
        uint64_t lastSent;

        ofPoint originalCorners[4];
        ofPoint distortedCorners[4];
        ofMatrix4x4 homography;
};


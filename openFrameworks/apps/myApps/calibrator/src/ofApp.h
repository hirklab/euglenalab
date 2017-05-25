#pragma once

#include "ofMain.h"
#include "ofxCv.h"

#define DISPLAY_WIDTH 640
#define DISPLAY_HEIGHT 480

#define PROJECTOR_WIDTH 100
#define PROJECTOR_HEIGHT 100
#define PROJECTOR_FRAMERATE 5

#define CAMERA_WIDTH 640
#define CAMERA_HEIGHT 480
#define CAMERA_FRAMERATE 60

enum Mode {PHASE0, PHASE1, PHASE2, TEST};

class ofApp : public ofBaseApp{

    public:

        void setup();
        void update();
        void draw();

        void drawProjection();

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
        ofFbo fbo;

        ofRectangle viewportDisplay;
        ofRectangle viewportProjector;

        ofxCv::Calibration calibrationCamera;
        ofxCv::Calibration calibrationProjector;
        
        Mode mode;

        ofMatrix4x4 m;

        cv::Mat rotateCamToProjector;
        cv::Mat translateCamToProjector;
        string extrinsics;

        int cameraWidth;
        int cameraHeight;
        float projectionZoom;
        int projectionX;
        int projectionY;
        int projectionWidth;
        int projectionHeight;
        float projectionRotation;

        ofxTCPServer TCP;

        // ofTrueTypeFont  mono;
        // ofTrueTypeFont  monosm;

        vector <string> storeText;
        uint64_t lastSent;
};

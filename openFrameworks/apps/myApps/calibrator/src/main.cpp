#include "ofApp.h"

//========================================================================
int main( ){
        ofSetupOpenGL(PROJECTOR_WIDTH,PROJECTOR_HEIGHT,OF_FULLSCREEN);                  // <------
-- setup the GL context

        // this kicks off the running of my app
        // can be OF_WINDOW or OF_FULLSCREEN
        // pass in width and height too:
        ofRunApp(new ofApp());


        // ofGLFWWindowSettings settings;

 //    settings.width = DISPLAY_WIDTH;
 //    settings.height = DISPLAY_HEIGHT;
 //    settings.setPosition(ofVec2f(100, 100));
 //    settings.resizable = true;
 //    shared_ptr<ofAppBaseWindow> mainWindow = ofCreateWindow(settings);

 //    settings.width = PROJECTOR_WIDTH;
 //    settings.height = PROJECTOR_HEIGHT;
 //    settings.setPosition(ofVec2f(ofGetScreenWidth(), 0));
 //    settings.resizable = false;
 //    settings.decorated = false;
 //    settings.shareContextWith = mainWindow;
 //    shared_ptr<ofAppBaseWindow> secondWindow = ofCreateWindow(settings);
 //    secondWindow->setVerticalSync(false);

 //    shared_ptr<ofApp> mainApp(new ofApp);
 //    // ofAddListener(secondWindow->events().draw, mainApp.get(), &ofApp::drawSecondWindow);

 //    ofRunApp(mainWindow, mainApp);

}

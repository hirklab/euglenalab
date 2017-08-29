#include <stdio.h>
#include <math.h>
#include <stdbool.h>
#include "singleton_factory.hpp"

#include <opencv2/opencv.hpp>
#include <opencv2/core/core.hpp>

#include <opencv2/imgproc/imgproc.hpp>

#include <opencv2/highgui/highgui.hpp>

#include <iostream>
#include <chrono>

#define PI 3.14159265

// Create a Kalman Filter class used to predict the position of euglena for more accurate live tracking
class KFTracker {
    public:
        cv::KalmanFilter KF;
        cv::Mat state;
        cv::Mat processNoise;
        cv::Mat measurement;
        std::vector<cv::Point>pointsVector, kalmanVector;
        bool init;

        KFTracker();
        virtual ~KFTracker();
        void track(float x, float y);          // Input measured position from live feed
        void initializeKF(float x, float y);
        void draw(cv::Mat img);                // Draw tight bound contour around euglena
        void drawPath(cv::Mat img);            // Draws path euglena has taken since start of tracking
    private:
};

// Struct to represent euglena objects on screen
struct EuglenaObject {
    cv::RotatedRect rect;       // Minimum bounding rotated rect from cv library 
    int ID;                     // Unique ID for each euglena on the screen
    bool tracked;               // Determiens whether this object has been matched to any euglena on screen
    KFTracker tracker;          // Kalman Filter object assigned to each euglena object
};

// class HungarianAssignment {
//     public:
//         float costMatrix[][];
//         int maxZeroes[][];
//         int minimumLines[][];

//         void initializeHA;
//         void calculateMaxZeroes;
//         void setLines;
//     private:
// };

class EuglenaProcessor : public Processor {
    public:
        EuglenaProcessor();
        virtual ~EuglenaProcessor();
        cv::Mat operator()(cv::Mat);
        char gameOverStr[80];
        bool gameInSession;
        int totalEuglena;
        bool demoMode;
        bool drawOnTrackedEuglena;
        bool viewEuglenaPaths;
        bool sandboxMode = false;
        bool sandboxVideo = false;
        bool sandboxVideoHasRecorded = false;
        bool sandboxModeFirstIteration = true;

        // Sandbox mode variables
        std::map<int, cv::Point2f> euglenaPositionsSandbox;
        std::map<int, double> euglenaVelocitiesSandbox;
        std::map<int, double> euglenaAccelerationsSandbox;
        std::map<int, float> euglenaAnglesSandbox;
        double joystickIntensity = 0;
        double joystickDirection = 0;

        int videoFileCount = 0;

        int frameIterations = 0;
        
        // Euglena tracking variables
        std::vector<EuglenaObject> trackedEuglenas;
        std::chrono::high_resolution_clock::time_point startTime;
        std::chrono::high_resolution_clock::time_point endTime;
        int frameCount = 0;
        float magnification;
        std::map<int, cv::Point2f> euglenaPositions;
        std::map<int, double> euglenaVelocities;
        std::map<int, double> euglenaAccelerations;
        std::map<int, float> euglenaAngles;

        // drawCircle
        char drawCircleCenterX[300];
        char drawCircleCenterY[300];
        char drawCircleRadius[300];
        char drawCircleR[300];
        char drawCircleG[300];
        char drawCircleB[300];

        // drawLine
        char drawLineX1[300];
        char drawLineY1[300];
        char drawLineX2[300];
        char drawLineY2[300];
        char drawLineR[300];
        char drawLineG[300];
        char drawLineB[300];

        // drawRect
        char drawRectUpperLeftX[300];
        char drawRectUpperLeftY[300];
        char drawRectLowerRightX[300];
        char drawRectLowerRightY[300]; 
        char drawRectR[300];
        char drawRectG[300]; 
        char drawRectB[300];

        // drawText
        char drawTextdrawTxt[300];
        char drawTextXPos[300];
        char drawTextYPos[300];
        char drawTextSize[300];
        char drawTextR[300];
        char drawTextG[300]; 
        char drawTextB[300];

        // getEugenaInRect
        double getEuglenaInRectUpperLeftX;
        double getEuglenaInRectUpperLeftY;
        double getEuglenaInRectLowerRightX;
        double getEuglenaInRectLowerRightY;
        char getEuglenaInRectReturnVal[10000];

        // getAllEuglenaPositions
        char getAllEuglenaPositionsStr[10000];

        // getEuglenaDensity
        double getEuglenaDensityUpperLeftX;
        double getEuglenaDensityUpperLeftY;
        double getEuglenaDensityLowerRightX;
        double getEuglenaDensityLowerRightY;
        double getEuglenaDensityReturnVal;

        //getAllEuglenaIDs
        char getAllEuglenaIDsStr[10000];

        //getEuglenaPositionByID
        int positionID;
        char targetEuglenaPositionStr[10000];

        //getEuglenaVelocityByID
        int velocityID;
        char targetEuglenaVelocityStr[10000];

        //getEuglenaAccelerationByID;
        int accelerationID;
        char targetEuglenaAccelerationStr[10000];

        //getEuglenaRotationByID
        int rotationID;
        char targetEuglenaRotationStr[10000];


        std::string targetEuglenaDirection;  //Not necessary

    private:
        std::vector<std::string> split(const std::string &text, char sep);
        cv::BackgroundSubtractor* _fgbg;
        cv::Mat _elementErode;
        cv::Mat _elementDilate;
        std::vector<cv::RotatedRect> _previousEuglenaPositions;
};


/* File manipulates images */

// take number image type number (from cv::Mat.type()), get OpenCV's enum string.
std::string getImgType(int imgTypeInt) {
    int numImgTypes = 35; // 7 base types, with five channel options each (none or C1, ..., C4)

    int enum_ints[] =       {CV_8U,  CV_8UC1,  CV_8UC2,  CV_8UC3,  CV_8UC4,
                             CV_8S,  CV_8SC1,  CV_8SC2,  CV_8SC3,  CV_8SC4,
                             CV_16U, CV_16UC1, CV_16UC2, CV_16UC3, CV_16UC4,
                             CV_16S, CV_16SC1, CV_16SC2, CV_16SC3, CV_16SC4,
                             CV_32S, CV_32SC1, CV_32SC2, CV_32SC3, CV_32SC4,
                             CV_32F, CV_32FC1, CV_32FC2, CV_32FC3, CV_32FC4,
                             CV_64F, CV_64FC1, CV_64FC2, CV_64FC3, CV_64FC4};

    std::string enum_strings[] = {"CV_8U",  "CV_8UC1",  "CV_8UC2",  "CV_8UC3",  "CV_8UC4",
                             "CV_8S",  "CV_8SC1",  "CV_8SC2",  "CV_8SC3",  "CV_8SC4",
                             "CV_16U", "CV_16UC1", "CV_16UC2", "CV_16UC3", "CV_16UC4",
                             "CV_16S", "CV_16SC1", "CV_16SC2", "CV_16SC3", "CV_16SC4",
                             "CV_32S", "CV_32SC1", "CV_32SC2", "CV_32SC3", "CV_32SC4",
                             "CV_32F", "CV_32FC1", "CV_32FC2", "CV_32FC3", "CV_32FC4",
                             "CV_64F", "CV_64FC1", "CV_64FC2", "CV_64FC3", "CV_64FC4"};

    for (int i=0; i<numImgTypes; i++) {
        if (imgTypeInt == enum_ints[i]) return enum_strings[i];
    }
    return "unknown image type";
}

// Constructs a new EuglenaProcessor
EuglenaProcessor::EuglenaProcessor() : _fgbg(0) {
    gameInSession = true;
    _fgbg = new cv::BackgroundSubtractorMOG2(500,16,false);
    _elementErode  = getStructuringElement( cv::MORPH_ELLIPSE, cv::Size( 3, 3 ));
    _elementDilate = getStructuringElement( cv::MORPH_ELLIPSE, cv::Size( 5, 5 ));
    std::strcpy(gameOverStr, "");

}

// Deconstructs EuglenaProcessor
EuglenaProcessor::~EuglenaProcessor() {
    if (_fgbg)
        delete _fgbg;
}

// Helper functions.
std::vector<std::string> EuglenaProcessor::split(const std::string &text, char sep) {
  std::vector<std::string> tokens;
  std::size_t start = 0, end = 0;
  while ((end = text.find(sep, start)) != std::string::npos) {
    tokens.push_back(text.substr(start, end - start));
    start = end + 1;
  }
  tokens.push_back(text.substr(start));
  return tokens;
}

KFTracker::KFTracker() {
    KF = cv::KalmanFilter(4, 2, 0);
    state = cv::Mat(4, 1, CV_32FC1);
    processNoise = cv::Mat(4, 1, CV_32F);
    measurement = cv::Mat(2, 1, CV_32FC1);
    measurement.setTo(cv::Scalar(0));
    init = true;
}

KFTracker::~KFTracker() {}

void KFTracker::initializeKF(float x, float y) {
    KF.statePre.at<float>(0) = x;
    KF.statePre.at<float>(1) = y;
    KF.statePre.at<float>(2) = 0;
    KF.statePre.at<float>(3) = 0;

    KF.transitionMatrix = *(cv::Mat_<float>(4, 4) << 1,0,0,0,   0,1,0,0,   0,0,1,0,   0,0,0,1 );

    cv::setIdentity(KF.measurementMatrix);
    cv::setIdentity(KF.processNoiseCov, cv::Scalar::all(1e-4));
    cv::setIdentity(KF.measurementNoiseCov, cv::Scalar::all(1e-4));
    cv::setIdentity(KF.errorCovPost, cv::Scalar::all(.1));
    
    pointsVector.clear();
    kalmanVector.clear();
    
    init = false;
}

void KFTracker::track(float x, float y) {
    if ( init )
        initializeKF(x, y);

    cv::Mat prediction = KF.predict();
    cv::Point predictPt(prediction.at<float>(0), prediction.at<float>(1));
    
    measurement.at<float>(0,0) = x;
    measurement.at<float>(1,0) = y;

    cv::Point measPt(measurement.at<float>(0,0), measurement.at<float>(1,0));
    pointsVector.push_back(measPt);

    cv::Mat estimated = KF.correct(measurement);
    cv::Point statePt( estimated.at<float>(0), estimated.at<float>(1) );
    kalmanVector.push_back(statePt);
 }

void KFTracker::draw(cv::Mat img) {
    if (kalmanVector.size() >= 2) {
        for (int i=kalmanVector.size()-4; i<kalmanVector.size()-1; i++) {
            line(img, kalmanVector[i], kalmanVector[i+1], cv::Scalar(0,255,0), 1);
        }
        line(img, kalmanVector[kalmanVector.size()-1], kalmanVector[kalmanVector.size()-4], cv::Scalar(0,255,0),1);
    }
}

void KFTracker::drawPath(cv::Mat img) {
    if (kalmanVector.size() >= 2) {
        for (int i=0; i<kalmanVector.size()-1; i++) {
                line(img, kalmanVector[i], kalmanVector[i+1], cv::Scalar(0,255,0), 1);
        }
    }
}

cv::Mat EuglenaProcessor::operator()(cv::Mat im) {

    // Draw simulation on top of image if in sandbox mode.
    if (sandboxMode) {

        if (sandboxVideo) {

            sandboxModeFirstIteration = true;

            if (!sandboxVideoHasRecorded) {
                cv::rectangle(im, cv::Point(0.0, 0.0), cv::Point(640.0, 480.0), cv::Scalar(0, 0, 0, 255), -1);
                cv::putText(im, "Record a video using the tooltip above", cv::Point(10.0, 20.0), cv::FONT_HERSHEY_DUPLEX, 0.7, cv::Scalar(255,0,0,255));
            }

        } else {

            // SIMULATION MODE

            cv::rectangle(im, cv::Point(0.0, 0.0), cv::Point(640.0, 480.0), cv::Scalar(0, 0, 0, 255), -1);

            if (sandboxModeFirstIteration) {
                euglenaPositionsSandbox[0] = cv::Point2f(50.0, 50.0);
                euglenaPositionsSandbox[1] = cv::Point2f(120.0, 120.0);
                euglenaPositionsSandbox[2] = cv::Point2f(190.0, 190.0);
                euglenaPositionsSandbox[3] = cv::Point2f(260.0, 260.0);
                euglenaPositionsSandbox[4] = cv::Point2f(330.0, 330.0);
                euglenaAnglesSandbox[0] = rand() % 360;
                euglenaAnglesSandbox[1] = rand() % 360;
                euglenaAnglesSandbox[2] = rand() % 360;
                euglenaAnglesSandbox[3] = rand() % 360;
                euglenaAnglesSandbox[4] = rand() % 360;
                euglenaVelocitiesSandbox[0] = 1.5 + ((double)rand() / RAND_MAX)*2;
                euglenaVelocitiesSandbox[1] = 0.1 + ((double)rand() / RAND_MAX)*2;
                euglenaVelocitiesSandbox[2] = 1.5 + ((double)rand() / RAND_MAX)*2;
                euglenaVelocitiesSandbox[3] = 0.1 + ((double)rand() / RAND_MAX)*2;
                euglenaVelocitiesSandbox[4] = 0.5 + ((double)rand() / RAND_MAX)*2;
                euglenaAccelerationsSandbox[0] = 0.0;
                euglenaAccelerationsSandbox[1] = 0.0;
                euglenaAccelerationsSandbox[2] = 0.0;
                euglenaAccelerationsSandbox[3] = 0.0;
                euglenaAccelerationsSandbox[4] = 0.0;
                sandboxModeFirstIteration = false;
            }

            // Draw all Euglenas based on position and rotation.
            int i;
            int j;

            // Update rotation of Euglena if they collide.
            for (i = 0; i < euglenaPositionsSandbox.size(); i++) {
                for (j = 0; j < euglenaPositionsSandbox.size(); j++) {
                    if (i != j) {
                        if (euglenaPositionsSandbox[i].x - 2 < euglenaPositionsSandbox[j].x 
                            && euglenaPositionsSandbox[i].x + 2 > euglenaPositionsSandbox[j].x
                            && euglenaPositionsSandbox[i].y - 2 < euglenaPositionsSandbox[j].y
                            && euglenaPositionsSandbox[i].y + 2 < euglenaPositionsSandbox[j].y) {
                            euglenaAnglesSandbox[i] = rand() % 360;
                            euglenaAnglesSandbox[j] = rand() % 360;
                        }
                    }
                }
            }

            // Add noise.

            // Update position of Euglena based on velocity and angle.
            //cv::putText(im, std::to_string(joystickDirection), cv::Point(100.0, 80.0), cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
            for (i = 0; i < euglenaPositionsSandbox.size(); i++) {
                // Add LED stimulus effects.
                if (joystickDirection >= 0 && joystickDirection < 180) {
                    euglenaAnglesSandbox[i] = ((1000.0 - joystickIntensity)*euglenaAnglesSandbox[i] + joystickIntensity*(180-joystickDirection)) / 1000.0;
                } else if (joystickDirection >= 180 && joystickDirection <= 360) {
                    euglenaAnglesSandbox[i] = ((1000.0 - joystickIntensity)*euglenaAnglesSandbox[i] + joystickIntensity*(540-joystickDirection)) / 1000.0;
                }
                // Increase position by r*cos(theta) in x direction and r*sin(theta) in y direction.
                euglenaPositionsSandbox[i].x += euglenaVelocitiesSandbox[i]*cos(euglenaAnglesSandbox[i] * PI / 180.0);
                euglenaPositionsSandbox[i].y += euglenaVelocitiesSandbox[i]*sin(euglenaAnglesSandbox[i] * PI / 180.0);
                // Adjust for Euglena that have left the screen.
                if (euglenaPositionsSandbox[i].x > 640 + 40) {
                    euglenaPositionsSandbox[i].x = -20;
                } else if (euglenaPositionsSandbox[i].x < -40) {
                    euglenaPositionsSandbox[i].x = 640 + 20;
                } else if (euglenaPositionsSandbox[i].y > 480 + 40) {
                    euglenaPositionsSandbox[i].y = -20;
                } else if (euglenaPositionsSandbox[i].y < -40) {
                    euglenaPositionsSandbox[i].y = 480 + 20;
                }
            }

            // Draw Euglena.
            for (i = 0; i < euglenaPositionsSandbox.size(); i++) {
                cv::ellipse(im, euglenaPositionsSandbox[i], cv::Size(20, 4), euglenaAnglesSandbox[i], 0.0, 360.0, cv::Scalar(0, 255, 0, 255), -1);
            }

        }

    } 

    // Assign calculated velocity, accelleration, and angle of rotation for a target euglena to user facing variables 

    cv::Mat fgmask;
    (*_fgbg)(im,fgmask,-1);

    cv::Mat dst;

    cv::threshold(fgmask,fgmask, 127, 255, cv::THRESH_BINARY);
    cv::morphologyEx( fgmask, fgmask, cv::MORPH_ERODE,  _elementErode );
    cv::morphologyEx( fgmask, fgmask, cv::MORPH_DILATE, _elementDilate );

    std::vector<std::vector<cv::Point> > contours;
    cv::findContours( fgmask, contours,
                      cv::RETR_TREE,cv::CHAIN_APPROX_SIMPLE);

    int currEuglenaInBox = 0;
    int totalDetectedEuglena = 0;

    // Variable to store time from start of the program in milliseconds
    std::chrono::duration<double, std::milli> elapsedTimeInMilliseconds;

    if (gameInSession) {
        if (demoMode) {
            // Do something with demo mode here, if applicable.
        }

        memset(getAllEuglenaPositionsStr, 0, 10000*sizeof(char));
        std::strcpy(getAllEuglenaPositionsStr, ";");

        cv::putText(im, gameOverStr, cv::Point(100.0, 80.0), cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));

        // Create circles.
        std::vector<std::string> drawCircleCenterXVector = split(drawCircleCenterX, '*');
        std::vector<std::string> drawCircleCenterYVector = split(drawCircleCenterY, '*');
        std::vector<std::string> drawCircleRadiusVector = split(drawCircleRadius, '*');
        std::vector<std::string> drawCircleRVector = split(drawCircleR, '*');
        std::vector<std::string> drawCircleGVector = split(drawCircleG, '*');
        std::vector<std::string> drawCircleBVector = split(drawCircleB, '*');
        for (int i = 0; i < drawCircleCenterXVector.size()-1; i++) {
            cv::circle(im, cv::Point(std::stod(drawCircleCenterXVector.at(i)), std::stod(drawCircleCenterYVector.at(i))), std::stod(drawCircleRadiusVector.at(i)), cv::Scalar(std::stod(drawCircleRVector.at(i)), std::stod(drawCircleGVector.at(i)), std::stod(drawCircleBVector.at(i)), 255), 2);      
        }

        // Draw lines.
        std::vector<std::string> drawLineX1Vector = split(drawLineX1, '*');
        std::vector<std::string> drawLineY1Vector = split(drawLineY1, '*');
        std::vector<std::string> drawLineX2Vector = split(drawLineX2, '*');
        std::vector<std::string> drawLineY2Vector = split(drawLineY2, '*');
        std::vector<std::string> drawLineRVector = split(drawLineR, '*');
        std::vector<std::string> drawLineGVector = split(drawLineG, '*');
        std::vector<std::string> drawLineBVector = split(drawLineB, '*');
        for (int i = 0; i < drawLineX1Vector.size()-1; i++) {
            cv::line(im, cv::Point(std::stod(drawLineX1Vector.at(i)), std::stod(drawLineY1Vector.at(i))), cv::Point(std::stod(drawLineX2Vector.at(i)), std::stod(drawLineY2Vector.at(i))), cv::Scalar(std::stod(drawLineRVector.at(i)), std::stod(drawLineGVector.at(i)), std::stod(drawLineBVector.at(i))));      
        }

        // Create rectangles.
        std::vector<std::string> drawRectUpperLeftXVector = split(drawRectUpperLeftX, '*');
        std::vector<std::string> drawRectUpperLeftYVector = split(drawRectUpperLeftY, '*');
        std::vector<std::string> drawRectLowerRightXVector = split(drawRectLowerRightX, '*');
        std::vector<std::string> drawRectLowerRightYVector = split(drawRectLowerRightY, '*');
        std::vector<std::string> drawRectRVector = split(drawRectR, '*');
        std::vector<std::string> drawRectGVector = split(drawRectG, '*');
        std::vector<std::string> drawRectBVector = split(drawRectB, '*');
        for (int i = 0; i < drawRectUpperLeftXVector.size()-1; i++) {
            //cv::rectangle(im, cv::Point(i*5.0, i*10.0), cv::Point(i*15.0+20, i*20.0+20), cv::Scalar(200, 0, 0, 255), 2);
            cv::rectangle(im, cv::Point(std::stod(drawRectUpperLeftXVector.at(i)), std::stod(drawRectUpperLeftYVector.at(i))), cv::Point(std::stod(drawRectLowerRightXVector.at(i)), std::stod(drawRectLowerRightYVector.at(i))), cv::Scalar(std::stod(drawRectRVector.at(i)), std::stod(drawRectGVector.at(i)), std::stod(drawRectBVector.at(i)), 255), 2);      
        }

        // Create text renderings.
        std::vector<std::string> drawTextdrawTxtVector = split(drawTextdrawTxt, '*');
        std::vector<std::string> drawTextXPosVector = split(drawTextXPos, '*');
        std::vector<std::string> drawTextYPosVector = split(drawTextYPos, '*');
        std::vector<std::string> drawTextSizeVector = split(drawTextSize, '*');
        std::vector<std::string> drawTextRVector = split(drawTextR, '*');
        std::vector<std::string> drawTextGVector = split(drawTextG, '*');
        std::vector<std::string> drawTextBVector = split(drawTextB, '*');
        for (int i = 0; i < drawTextdrawTxtVector.size()-1; i++) {
            //cv::putText(im, "test text!", cv::Point(i*30.0+20, i*30.0+20), cv::FONT_HERSHEY_DUPLEX, 0.3, cv::Scalar(0, 255, 0, 255));
            cv::putText(im, drawTextdrawTxtVector.at(i), cv::Point(std::stod(drawTextXPosVector.at(i)), std::stod(drawTextYPosVector.at(i))), cv::FONT_HERSHEY_DUPLEX, std::stod(drawTextSizeVector.at(i)), cv::Scalar(std::stod(drawTextRVector.at(i)), std::stod(drawTextGVector.at(i)), std::stod(drawTextBVector.at(i)), 255));
        }

        // int sizeOfContourVector = contours.size();
        // int sizeOfTrackedVector = trackedEuglenas.size();
        // float costMatrix[sizeOfContourVector][sizeOfTrackedVector];


        frameIterations++;
        if (frameIterations % 10000 == 0) {
            frameIterations = 0;
            return im;
        }
        
        // Draw around the Euglenas and check that every point of the bounding box falls within the current blue box.
        for (auto &c : contours) {              // Detect all contours on the screen
            if ( cv::contourArea(c) > magnification*magnification*0.8) {  // Filter contours for only euglena objects
                totalDetectedEuglena += 1;
                cv::RotatedRect e = cv::minAreaRect(c);
                cv::Point2f pts[4];
                e.points(pts);
                bool haveWeAddedEuglenaPositionYet = false;
                bool matched = false;
                int count = -1;
                int index = 0;

                 // Compare all detected contours to euglena objects to match computer objects to vision objects
                for (auto &g : trackedEuglenas) {          
                    count += 1;
                    std::vector<cv::Point2f> intersectingVertices;
                    std::vector<cv::Point2f> rectVector;
                    cv::Point2f objPts[4];
                    g.rect.points(objPts);
                    int KVIndex = g.tracker.kalmanVector.size() - 1;
                    std::vector<cv::Point2f> objVector;
                    for (int j = 0; j<4;j++) {
                        rectVector.push_back(pts[j]);
                        //objVector.push_back(g.tracker.kalmanVector[KVIndex]);
                        objVector.push_back(objPts[j]);
                        KVIndex -= 1;
                    }
                    float intersection = cv::intersectConvexConvex( rectVector, objVector, intersectingVertices );  
                    float objArea = g.rect.size.width * g.rect.size.height;
                    
                    // If there is 40% overlap between predicted position and detected contour assume they are the same object
                    if (intersection > 0.4*objArea) {
                        matched = true;
                        index = count;
                    } 
                }

                // Create new object trackers for unassigned EUglena
                if (!matched) {
                    matched = true;
                    EuglenaObject euglena;
                    if (trackedEuglenas.size() == 0) {
                        euglena.ID = 1;
                    } else {
                        euglena.ID = trackedEuglenas[trackedEuglenas.size() - 1].ID + 1;
                    }
                    trackedEuglenas.push_back (euglena);
                    index = trackedEuglenas.size() - 1;
                }
                trackedEuglenas[index].rect = e;
                trackedEuglenas[index].tracked = true;


                for (int i=0;i<4;i++) {
                    if (!haveWeAddedEuglenaPositionYet) {
                        haveWeAddedEuglenaPositionYet = true;
                        std::strcat(getAllEuglenaPositionsStr, "(");
                        std::strcat(getAllEuglenaPositionsStr, std::to_string(pts[i].x).c_str());
                        std::strcat(getAllEuglenaPositionsStr, ",");
                        std::strcat(getAllEuglenaPositionsStr, std::to_string(pts[i].y).c_str());
                        std::strcat(getAllEuglenaPositionsStr, ");");
                    }

                    trackedEuglenas[index].tracker.track(pts[i].x, pts[i].y);
                    
                }
            }
        }

        totalEuglena = totalDetectedEuglena;

        memset(getEuglenaInRectReturnVal, 0, 10000*sizeof(char));
        std::strcpy(getEuglenaInRectReturnVal, ";");
        
        memset(getAllEuglenaIDsStr, 0, 10000*sizeof(char));
        std::strcpy(getAllEuglenaIDsStr, ";");

        memset(targetEuglenaPositionStr, 0, 10000*sizeof(char));
        std::strcpy(targetEuglenaPositionStr, " ");

        memset(targetEuglenaAccelerationStr, 0, 10000*sizeof(char));
        std::strcpy(targetEuglenaAccelerationStr, " ");

        memset(targetEuglenaVelocityStr, 0, 10000*sizeof(char));
        std::strcpy(targetEuglenaVelocityStr, " ");

        memset(targetEuglenaRotationStr, 0, 10000*sizeof(char));
        std::strcpy(targetEuglenaRotationStr, " ");

        int position = -1;
        float xPosition;
        float yPosition;
        for (auto &e : trackedEuglenas) {
            position += 1;
            if (e.tracked) {
                std::strcat(getAllEuglenaIDsStr, std::to_string(e.ID).c_str());
                std::strcat(getAllEuglenaIDsStr, ";");
                e.tracked = false;
                xPosition = (e.tracker.kalmanVector[e.tracker.kalmanVector.size()-4].x + e.tracker.kalmanVector[e.tracker.kalmanVector.size()-2].x)/2;
                yPosition = (e.tracker.kalmanVector[e.tracker.kalmanVector.size()-4].y + e.tracker.kalmanVector[e.tracker.kalmanVector.size()-2].y)/2;
                cv::Rect rRectBox(cv::Point(getEuglenaInRectUpperLeftX, getEuglenaInRectUpperLeftY), cv::Point(getEuglenaInRectLowerRightX, getEuglenaInRectLowerRightY));
                if (rRectBox.contains(cv::Point(xPosition,yPosition))) {
                    std::strcat(getEuglenaInRectReturnVal, std::to_string(e.ID).c_str());
                    std::strcat(getEuglenaInRectReturnVal, ";");
                }
                // std::strcat(targetEuglenaPositionStr, std::to_string(positionID).c_str());
                // std::strcat(targetEuglenaPositionStr, ",");
                // std::strcat(targetEuglenaPositionStr, std::to_string(e.ID).c_str());
                // std::strcat(targetEuglenaPositionStr, "!!");

                std::strcat(targetEuglenaPositionStr, std::to_string(e.ID).c_str());
                std::strcat(targetEuglenaPositionStr, ": (");
                std::strcat(targetEuglenaPositionStr, std::to_string(xPosition).c_str());
                std::strcat(targetEuglenaPositionStr, ",");
                std::strcat(targetEuglenaPositionStr, std::to_string(yPosition).c_str());
                std::strcat(targetEuglenaPositionStr, ");");

                cv::Point2f currPosition(xPosition, yPosition);
                if (viewEuglenaPaths) {
                    e.tracker.drawPath(im);
                    cv::putText(im, std::to_string(e.ID), e.rect.center, cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
                } else if (drawOnTrackedEuglena) {
                    e.tracker.draw(im);
                    cv::putText(im, std::to_string(e.ID), e.rect.center, cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
                }
                float angle;
                if (e.rect.size.width < e.rect.size.height) {
                    if (xPosition < e.rect.center.x) {
                        angle = e.rect.angle + 360;
                    } else {
                        angle = e.rect.angle + 180;
                    }
                } else {
                    if (xPosition < e.rect.center.x) {
                        angle = e.rect.angle + 270;
                    } else {
                        angle = e.rect.angle + 90;
                    }
                }
                euglenaAngles[e.ID] = angle;
                std::strcat(targetEuglenaRotationStr, std::to_string(e.ID).c_str());
                std::strcat(targetEuglenaRotationStr, ":");
                std::strcat(targetEuglenaRotationStr, std::to_string(angle).c_str());
                std::strcat(targetEuglenaRotationStr, ";");

                // Return acceleration, velocity, position, rotation
                if (frameCount%10 == 0) {
                    if (frameCount>=10) {
                        endTime = std::chrono::high_resolution_clock::now();
                        elapsedTimeInMilliseconds = endTime - startTime;
                        if (euglenaPositions.count(e.ID)){
                            double deltaDistance = cv::norm(currPosition - euglenaPositions[e.ID]);
                            double distanceInMicrons = deltaDistance / (100 * (((30.0*magnification)/4.0)) );
                            double velocity = distanceInMicrons/elapsedTimeInMilliseconds.count();
                            if (frameCount>=20) {
                                if (euglenaVelocities.count(e.ID)) {
                                    if (euglenaVelocities[e.ID] != -1) {
                                        double deltaVelocity = std::abs(velocity - euglenaVelocities[e.ID]);
                                        double acceleration = deltaVelocity/elapsedTimeInMilliseconds.count();
                                        euglenaAccelerations[e.ID] = acceleration;
                                        std::strcat(targetEuglenaAccelerationStr, std::to_string(e.ID).c_str());
                                        std::strcat(targetEuglenaAccelerationStr, ":");
                                        std::strcat(targetEuglenaAccelerationStr, std::to_string(acceleration).c_str());
                                        std::strcat(targetEuglenaAccelerationStr, ";");
                                    } else {
                                        euglenaAccelerations[e.ID] = -1;
                                    }
                                } else {
                                    euglenaAccelerations[e.ID] = -1;
                                }
                            } else {
                                euglenaAccelerations[e.ID] = -1;
                            }
                            euglenaVelocities[e.ID] = velocity;
                            std::strcat(targetEuglenaVelocityStr, std::to_string(e.ID).c_str());
                            std::strcat(targetEuglenaVelocityStr, ":");
                            std::strcat(targetEuglenaVelocityStr, std::to_string(velocity).c_str());
                            std::strcat(targetEuglenaVelocityStr, ";");
                        } else {
                            euglenaVelocities[e.ID] = -1;
                        } 
                    } else {
                        euglenaVelocities[e.ID] = -1;
                    }
                    startTime = std::chrono::high_resolution_clock::now();
                    euglenaPositions[e.ID] = currPosition;
                }   
            } else {
                trackedEuglenas.erase(trackedEuglenas.begin() + position);
                position -= 1;
            }
        }

        // Display current Euglena in box.
        // char scoreStr[80];
        // std::strcpy(scoreStr, "Euglena in box: ");
        // std::strcat(scoreStr, std::to_string(currEuglenaInBox).c_str());
        // cv::putText(im, scoreStr, cv::Point(2.0, 10.0), cv::FONT_HERSHEY_DUPLEX, 0.4, cv::Scalar(255,0,0,255));

        // // Display Euglena needed to win.
        // char reqScoreStr[80];
        // std::strcpy(reqScoreStr, "Euglena needed: ");
        // std::strcat(reqScoreStr, std::to_string((int)(0.1*totalDetectedEuglena)).c_str());
        // cv::putText(im, reqScoreStr, cv::Point(2.0, 30.0), cv::FONT_HERSHEY_DUPLEX, 0.4, cv::Scalar(255,0,0,255));
    } else {
        memset(gameOverStr, 0, 80*sizeof(char));
        totalEuglena = 0;
        demoMode = false;
        drawOnTrackedEuglena = false;
        viewEuglenaPaths = false;
        
        // Euglena tracking variables
        trackedEuglenas.clear();
        //std::chrono::high_resolution_clock::time_point startTime;
        //std::chrono::high_resolution_clock::time_point endTime;
        frameCount = 0;
        euglenaPositions.clear();
        euglenaVelocities.clear();
        euglenaAccelerations.clear();
        euglenaAngles.clear();

        // drawCircle
        memset(drawCircleCenterX, 0, 300*sizeof(char));
        memset(drawCircleCenterY, 0, 300*sizeof(char));
        memset(drawCircleRadius, 0, 300*sizeof(char));
        memset(drawCircleR, 0, 300*sizeof(char));
        memset(drawCircleG, 0, 300*sizeof(char));
        memset(drawCircleB, 0, 300*sizeof(char));

        // drawLine
        memset(drawLineX1, 0, 300*sizeof(char));
        memset(drawLineY1, 0, 300*sizeof(char));
        memset(drawLineX2, 0, 300*sizeof(char));
        memset(drawLineY2, 0, 300*sizeof(char));
        memset(drawLineR, 0, 300*sizeof(char));
        memset(drawLineG, 0, 300*sizeof(char));
        memset(drawLineB, 0, 300*sizeof(char));

        // drawRect
        memset(drawRectUpperLeftX, 0, 300*sizeof(char));
        memset(drawRectUpperLeftY, 0, 300*sizeof(char));
        memset(drawRectLowerRightX, 0, 300*sizeof(char));
        memset(drawRectLowerRightY, 0, 300*sizeof(char));
        memset(drawRectR, 0, 300*sizeof(char));
        memset(drawRectG, 0, 300*sizeof(char));
        memset(drawRectB, 0, 300*sizeof(char));

        // drawText
        memset(drawTextdrawTxt, 0, 300*sizeof(char));
        memset(drawTextXPos, 0, 300*sizeof(char));
        memset(drawTextYPos, 0, 300*sizeof(char));
        memset(drawTextSize, 0, 300*sizeof(char));
        memset(drawTextR, 0, 300*sizeof(char));
        memset(drawTextG, 0, 300*sizeof(char));
        memset(drawTextB, 0, 300*sizeof(char));

        // getEugenaInRect
        getEuglenaInRectUpperLeftX = 0;
        getEuglenaInRectUpperLeftY = 0;
        getEuglenaInRectLowerRightX = 0;
        getEuglenaInRectLowerRightY = 0;
        memset(getEuglenaInRectReturnVal, 0, 10000*sizeof(char));

        // getAllEuglenaPositions
        memset(getAllEuglenaPositionsStr, 0, 10000*sizeof(char));

        // getEuglenaDensity
        getEuglenaDensityUpperLeftX = 0;
        getEuglenaDensityUpperLeftY = 0;
        getEuglenaDensityLowerRightX = 0;
        getEuglenaDensityLowerRightY = 0;
        getEuglenaDensityReturnVal = 0;

        //getAllEuglenaIDs
        memset(getAllEuglenaIDsStr, 0, 10000*sizeof(char));

        //getEuglenaPositionByID
        positionID = 0;
        memset(targetEuglenaPositionStr, 0, 10000*sizeof(char));

        //getEuglenaVelocityByID
        velocityID = 0;
        memset(targetEuglenaVelocityStr, 0, 10000*sizeof(char));

        //getEuglenaAccelerationByID;
        accelerationID = 0;
        memset(targetEuglenaAccelerationStr, 0, 10000*sizeof(char));

        //getEuglenaRotationByID
        rotationID = 0;
        memset(targetEuglenaRotationStr, 0, 10000*sizeof(char));

        joystickDirection = 0;
        joystickIntensity = 0;
    }

    // Display game over if that's the case.
    if (currEuglenaInBox >= 0.1*totalDetectedEuglena || gameInSession == false) {
        gameInSession = false;
        cv::putText(im, gameOverStr, cv::Point(100.0, 80.0), cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
    }

    frameCount += 1;
    return im;
}

namespace {
  auto euglenaProcReg = ProcessorRegister<EuglenaProcessor>("Euglena");
}

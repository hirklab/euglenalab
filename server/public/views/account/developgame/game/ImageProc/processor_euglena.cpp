#include <stdio.h>
#include <stdbool.h>
#include "singleton_factory.hpp"

#include <opencv2/opencv.hpp>
#include <opencv2/core/core.hpp>

#include <opencv2/imgproc/imgproc.hpp>

#include <opencv2/highgui/highgui.hpp>

#include <iostream>
//#include "global.h"
//#include "KFTracker.h"
//#include "processor_euglena.h"
class KFTracker {
    public:
        cv::KalmanFilter KF;
        cv::Mat systemState;
        cv::Mat precessNoise;
        cv::Mat systemMeasurement;
        std::vector<cv::Point>pointsVector, kalmanVector;
        bool init;

        KFTracker();
        virtual ~KFTracker();
        void track(float x, float y);
        void initializeKF(float x, float y);
        void draw(cv::Mat img);
        void drawPath(cv::Mat img);
    private:
};

struct EuglenaObject {
    cv::RotatedRect rect;
    int ID;
    bool tracked;
    KFTracker tracker;
};

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
        
        // Euglena tracking variables
        std::vector<EuglenaObject> trackedEuglenas;
        int euglenaID;
        std::time_t startTime;
        std::time_t endTime;
        int frameCounts = 0;
        int magnification;
        std::map<int, cv::Point2f> prevEuglenaPositions;
        std::map<int, float> euglenaVelocities;

        // drawRect
        double drawRectUpperLeftX;
        double drawRectUpperLeftY;
        double drawRectLowerRightX;
        double drawRectLowerRightY; 
        double drawRectR;
        double drawRectG; 
        double drawRectB;

        // drawText
        char drawTextdrawTxt[80];
        double drawTextXPos;
        double drawTextYPos;
        double drawTextSize;
        double drawTextR;
        double drawTextG; 
        double drawTextB;

        // getEugenaInRect
        double getEuglenaInRectUpperLeftX;
        double getEuglenaInRectUpperLeftY;
        double getEuglenaInRectLowerRightX;
        double getEuglenaInRectLowerRightY;
        double getEuglenaInRectReturnVal;

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
        char targetEuglenaPositionStr[10];

        //getEuglenaVelocityByID
        float targetEuglenaVelocity;

        //getEuglenaRotationByID
        float targetEuglenaRotation;

    private:
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

KFTracker::KFTracker() {
    KF = cv::KalmanFilter(4, 2, 0);
    systemState = cv::Mat(4, 1, CV_32FC1);
    precessNoise = cv::Mat(4, 1, CV_32F);
    systemMeasurement = cv::Mat(2, 1, CV_32FC1);
    systemMeasurement.setTo(cv::Scalar(0));
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
    systemMeasurement.at<float>(0,0) = x;
    systemMeasurement.at<float>(1,0) = y;
    cv::Point measPt(systemMeasurement.at<float>(0,0), systemMeasurement.at<float>(1,0));
    pointsVector.push_back(measPt);
    cv::Mat estimated = KF.correct(systemMeasurement);
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
    for (int i=0; i<kalmanVector.size()-1; i++) {
            line(img, kalmanVector[i], kalmanVector[i+1], cv::Scalar(0,255,0), 1);
    }
}

cv::Mat EuglenaProcessor::operator()(cv::Mat im) {
    printf("Processing images..."); 

    frameCounts += 1;
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
    double elapsedTime;

    if (gameInSession) {
        if (demoMode) {
            // Do something with demo mode here, if applicable.
        }

        memset(getAllEuglenaPositionsStr, 0, 10000*sizeof(char));
        std::strcpy(getAllEuglenaPositionsStr, ";");

        cv::putText(im, gameOverStr, cv::Point(100.0, 80.0), cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));

        // Create goal box.
        cv::rectangle(im, cv::Point(drawRectUpperLeftX, drawRectUpperLeftY), cv::Point(drawRectLowerRightX, drawRectLowerRightY), cv::Scalar(drawRectR,drawRectG,drawRectB,255), 2);      

        totalEuglena = totalDetectedEuglena;

        
        // Draw around the Euglenas and check that every point of the bounding box falls within the current blue box.
        getEuglenaInRectReturnVal = 0;
        for (auto &c : contours) {
            if ( cv::contourArea(c) > 80.0 ) {
                totalDetectedEuglena += 1;
                cv::RotatedRect e = cv::minAreaRect(c);
                cv::Point2f pts[4];
                e.points(pts);
                bool withinScoreRect = false;
                bool withinBoxRect = false;
                bool haveWeAddedEuglenaPositionYet = false;
                bool matched = false;
                int count = -1;
                int index = 0;
                for (auto &g : trackedEuglenas) {
                    count += 1;
                    std::vector<cv::Point2f> intersectingVertices;
                    std::vector<cv::Point2f> rectVector;
                    cv::Point2f objPts[4];
                    g.rect.points(objPts);
                    std::vector<cv::Point2f> objVector;
                    for (int j = 0; j<4;j++) {
                        rectVector.push_back(pts[j]);
                        objVector.push_back(objPts[j]);
                    }
                    float intersection = cv::intersectConvexConvex( rectVector, objVector, intersectingVertices );
                    float objArea = g.rect.size.width * g.rect.size.height;
                    if (intersection > 0.4*objArea) {
                        matched = true;
                        index = count;
                    } 
                }
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

                    cv::Rect rRect(cv::Point(drawRectUpperLeftX, drawRectUpperLeftY), cv::Point(drawRectLowerRightX, drawRectLowerRightY));
                    if (rRect.contains(cv::Point(pts[i].x, pts[i].y))) {
                        withinScoreRect = true;
                    }

                    cv::Rect rRectBox(cv::Point(getEuglenaInRectUpperLeftX, getEuglenaInRectUpperLeftY), cv::Point(getEuglenaInRectLowerRightX, getEuglenaInRectLowerRightY));
                    if (rRectBox.contains(cv::Point(pts[i].x, pts[i].y))) {
                        withinBoxRect = true;
                    }
                    
                }
                if (withinScoreRect) {
                    currEuglenaInBox += 1;
                }
                if (withinBoxRect) {
                    getEuglenaInRectReturnVal += 1;
                }
            }
        }
            
        int position = -1;
        float xPosition;
        float yPosition;
        for (auto &e : trackedEuglenas) {
            position += 1;
            if (e.tracked) {
                e.tracked = false;
                xPosition = (e.tracker.kalmanVector[e.tracker.kalmanVector.size()-4].x + e.tracker.kalmanVector[e.tracker.kalmanVector.size()-2].x)/2;
                yPosition = (e.tracker.kalmanVector[e.tracker.kalmanVector.size()-4].y + e.tracker.kalmanVector[e.tracker.kalmanVector.size()-2].y)/2;
                cv::Point2f currPosition(xPosition, yPosition);
                if (viewEuglenaPaths) {
                    e.tracker.drawPath(im);
                    cv::putText(im, std::to_string(e.ID), e.rect.center, cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
                } else if (drawOnTrackedEuglena) {
                    e.tracker.draw(im);
                    cv::putText(im, std::to_string(e.ID), e.rect.center, cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
                }
                std::strcat(getAllEuglenaIDsStr, std::to_string(e.ID).c_str());
                if (e.ID == euglenaID) {
                    std::strcat(targetEuglenaPositionStr, "(");
                    std::strcat(targetEuglenaPositionStr, std::to_string(xPosition).c_str());
                    std::strcat(targetEuglenaPositionStr, ",");
                    std::strcat(targetEuglenaPositionStr, std::to_string(yPosition).c_str());
                    std::strcat(targetEuglenaPositionStr, ");");
                }
                if (frameCounts%10 == 0) {
                    startTime = time(nullptr);
                    prevEuglenaPositions[e.ID] = currPosition;
                } else if (frameCounts%15 == 0) {
                    endTime = time(nullptr);
                    elapsedTime = std::difftime(endTime, startTime)*1000;
                    if (prevEuglenaPositions.count(e.ID)) {
                        float deltaDistance = cv::norm(currPosition - prevEuglenaPositions[e.ID]);
                        float distanceInMicrons = (((deltaDistance*magnification)/4.0)*100.0)/640.0;
                        float velocityMicronsPerMillisecond = distanceInMicrons/elapsedTime;
                        euglenaVelocities[e.ID] = velocityMicronsPerMillisecond;
                        targetEuglenaVelocity = euglenaVelocities[e.ID];
                    } else {
                        targetEuglenaVelocity = -1.0;
                    }
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

        // cv::putText(im, drawTextdrawTxt, cv::Point(drawTextXPos, drawTextYPos), cv::FONT_HERSHEY_DUPLEX, drawTextSize, cv::Scalar(drawTextR,drawTextG,drawTextB,255));
    }

    // Display game over if that's the case.
    if (currEuglenaInBox >= 0.1*totalDetectedEuglena || gameInSession == false) {
        gameInSession = false;
        // cv::putText(im, gameOverStr, cv::Point(100.0, 80.0), cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
    }

    return im;
}

namespace {
  auto euglenaProcReg = ProcessorRegister<EuglenaProcessor>("Euglena");
}

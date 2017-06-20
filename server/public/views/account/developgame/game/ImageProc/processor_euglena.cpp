#include <stdio.h>
#include <stdbool.h>
#include "singleton_factory.hpp"
#include <opencv2/core/core.hpp>
#include "opencv2/imgproc/imgproc.hpp"
//#include <opencv2/highgui/highgui.hpp>
#include <opencv2/video/background_segm.hpp>


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

    private:
        cv::BackgroundSubtractor* _fgbg;
        cv::Mat _elementErode;
        cv::Mat _elementDilate;
        std::vector<cv::RotatedRect> _previousEuglenaPositions;
};

EuglenaProcessor::EuglenaProcessor() : _fgbg(0) {
    gameInSession = true;
    _fgbg = new cv::BackgroundSubtractorMOG2(500,16,false);
    _elementErode  = getStructuringElement( cv::MORPH_ELLIPSE, cv::Size( 3, 3 ));
    _elementDilate = getStructuringElement( cv::MORPH_ELLIPSE, cv::Size( 5, 5 ));
    std::strcpy(gameOverStr, "");
}

EuglenaProcessor::~EuglenaProcessor() {
    if (_fgbg)
        delete _fgbg;
}

cv::Mat EuglenaProcessor::operator()(cv::Mat im) {
    printf("Processing images...");

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

    if (gameInSession) {
        if (demoMode) {
            // Do something with demo mode here, if applicable.
        }

        memset(getAllEuglenaPositionsStr, 0, 10000*sizeof(char));
        std::strcpy(getAllEuglenaPositionsStr, ";");

        cv::putText(im, gameOverStr, cv::Point(100.0, 80.0), cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));

        // Create goal box.
        cv::rectangle(im, cv::Point(drawRectUpperLeftX, drawRectUpperLeftY), cv::Point(drawRectLowerRightX, drawRectLowerRightY), cv::Scalar(drawRectR,drawRectG,drawRectB,255), 2);

        // Iterate over detected Euglena points and create a RotatedRect per Euglena.
        std::vector<cv::RotatedRect> euglenas;
        for (auto &c : contours) {
            if ( cv::contourArea(c) > 3.0 ) {
                cv::RotatedRect rect = cv::minAreaRect(c);
                euglenas.push_back( rect );
                totalDetectedEuglena += 1;
            }
        }
        totalEuglena = totalDetectedEuglena;

        
        // Draw around the Euglenas and check that every point of the bounding box falls within the current blue box.
        getEuglenaInRectReturnVal = 0;
        for (auto &e : euglenas) {
            cv::Point2f pts[4];
            e.points(pts);
            bool withinScoreRect = false;
            bool withinBoxRect = false;
            bool haveWeAddedEuglenaPositionYet = false;
            for (int i=0;i<4;i++) {
                if (!haveWeAddedEuglenaPositionYet) {
                    haveWeAddedEuglenaPositionYet = true;
                    std::strcat(getAllEuglenaPositionsStr, "(");
                    std::strcat(getAllEuglenaPositionsStr, std::to_string(pts[i].x).c_str());
                    std::strcat(getAllEuglenaPositionsStr, ",");
                    std::strcat(getAllEuglenaPositionsStr, std::to_string(pts[i].y).c_str());
                    std::strcat(getAllEuglenaPositionsStr, ");");
                }

                if (drawOnTrackedEuglena) {
                    cv::line(im, pts[i], pts[(i+1)%4], cv::Scalar(0,255,0,255), 2);
                }
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

        cv::putText(im, drawTextdrawTxt, cv::Point(drawTextXPos, drawTextYPos), cv::FONT_HERSHEY_DUPLEX, drawTextSize, cv::Scalar(drawTextR,drawTextG,drawTextB,255));
    }

    // Display game over if that's the case.
    if (currEuglenaInBox >= 0.1*totalDetectedEuglena || gameInSession == false) {
        gameInSession = false;
        cv::putText(im, gameOverStr, cv::Point(100.0, 80.0), cv::FONT_HERSHEY_DUPLEX, 1.4, cv::Scalar(255,255,255,255));
    }


    return im;
}


namespace {
  auto euglenaProcReg = ProcessorRegister<EuglenaProcessor>("Euglena");
}

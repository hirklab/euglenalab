//include "improc_instance.hpp"
#include "singleton_factory.hpp"
//#include "url_loader_handler.hpp"
#include "processor_euglena.cpp"
#include <vector>
#include <thread>
#include <functional>
#include <emscripten.h>
#include <string>
//#include "json.hpp"
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <stdlib.h>
#include "opencv2/opencv.hpp"

using namespace emscripten;
using namespace cv;
//using json = nlohmann::json;

  //void postMessageToBrowser(const std::string& msg);
  void PostTest();
  void Process( cv::Mat im, std::unique_ptr<Processor>& processor);
  void drawBufferToCanvas(const std::string& buffer);



  /*void PostMessage(const std::string msg) {
    return PostMessage(msg.dump());
  }*/

  void drawBufferToCanvas(const std::string& buffer) {
    EM_ASM_({
      console.log(UTF8ToString($0));
    }, buffer.c_str());
  }

extern "C" {
  void postMessageToBrowser(const std::string& msg) {
    EM_ASM_({
      console.log(UTF8ToString($0));
    }, msg.c_str());
  }

  void SendStatus(const std::string& msg) {
    return postMessageToBrowser(msg);
  }

 bool run_simulation_ = false;
void EMSCRIPTEN_KEEPALIVE HandleMessage(unsigned char* u8pixels, std::string jsonCommand)  {
  int width = 200;
  int height = 200;
  float time = 100;
  unsigned int* byteData = (unsigned int*)u8pixels;
  /*  for(int y = 0; y < height; y++) {
        float fy = y / (float)height;
        int stride = y * width;
        for(int x = 0; x < width; x++) {
            float fx = x / (float)width;
            int c = 0xFF;

            float px = -1.0 + 2.0 * fx;
            float py = -1.0 + 2.0 * fy;
            px *= width / (float)height;

            // animation
            float tz = 0.5 - 0.5 * cos(0.225 * time * 0.001);
            float zoo = pow(0.5, 13.0 * tz);
            float cx = -0.05 + px * zoo;
            float cy = 0.6805 + py * zoo;

            // iterate
            float zx = 0.0f, zy = 0.0f;
            float m2 = 0.0f;
            float dzx = 0.0, dzy = 0.0;

            for(int i = 0; i < 256; i++) {
                if(m2 > 1024.0)
                    continue;

                // Z' -> 2·Z·Z' + 1
                float tempX = 2.0 * (zx * dzx - zy * dzy) + 1.0;
                dzy = 2.0 * (zx * dzy + zy * dzx);
                dzx = tempX;

                // Z -> Z² + c
                tempX = zx * zx - zy * zy + cx;
                zy = 2.0 * zx * zy + cy;
                zx = tempX;

                m2 = zx * zx + zy * zy;
            }
            // distance
            float d = 0.5 * sqrt((zx * zx + zy * zy) / (dzx * dzx + dzy * dzy)) * log(zx * zx + zy * zy);

            // do some soft coloring based on distance
            d = 8.0 * d / zoo;
            d = d < 0 ? 0.0 : d > 1 ? 1.0 : d;

            d = pow(d, 0.25);
            unsigned char v = d * 255;
            pixels[x + stride] = v | v << 8 | v << 16 | 0xFF000000;
        }
    }*/

 /* Called by javascript every frame.
    */
  //jsonCommand= std::string("{\"cmd\":\"process\",\"width\":640,\"height\":480,\"gameEndMsg\":\"\",\"gameInSession\":false,\"gameDemoMode\":false,\"gameDrawOnTrackedEuglena\":false,\"magnification\":10,\"sandboxMode\":false,\"sandboxVideo\":false,\"sandboxVideoHasRecorded\":false,\"joystickIntensity\":0.5,\"joystickDirection\":270,\"drawCircleCenterX\":[],\"drawCircleCenterY\":[],\"drawCircleRadius\":[],\"drawCircleR\":[],\"drawCircleG\":[],\"drawCircleB\":[],\"drawLineX1\":[],\"drawLineY1\":[],\"drawLineX2\":[],\"drawLineY2\":[],\"drawLineR\":[],\"drawLineG\":[],\"drawLineB\":[],\"drawRectUpperLeftX\":[],\"drawRectUpperLeftY\":[],\"drawRectLowerRightX\":[],\"drawRectLowerRightY\":[],\"drawRectR\":[],\"drawRectG\":[],\"drawRectB\":[],\"drawTextdrawTxt\":[],\"drawTextXPos\":[],\"drawTextYPos\":[],\"drawTextSize\":[],\"drawTextR\":[],\"drawTextG\":[],\"drawTextB\":[],\"getEuglenaInRectUpperLeftX\":0,\"getEuglenaInRectUpperLeftY\":0,\"getEuglenaInRectLowerRightX\":0,\"getEuglenaInRectLowerRightY\":0,\"getEuglenaAccelerationID\":0,\"getEuglenaPositionID\":30,\"getEuglenaRotationID\":0,\"getEuglenaVelocityID\":0,\"processor\":\"Euglena\"}");
  //std::strcpy(jsonCommand, std::string("{\"a\":2}"));
  SendStatus(CV_VERSION);
  SendStatus("beginning parse");

    //auto var_dict = json::parse(jsonCommand);
    auto var_dict = val::global("globalCommand");
    SendStatus("end parse");
    std::string cmd = "process";//var_dict["cmd"];
      if ( cmd == "process" ) {

        // Message is number of simulations to run
        int width  = var_dict["width"].as<int>();
        int height =  var_dict["height"].as<int>();

        // comm. for now:
        //std::string dataStr = var_dict["data"] ;
        // auto data = pp::VarArrayBuffer( dataStr ); // for now

        // todo: fix processor
        std::string selectedProcessor = var_dict["processor"].as<std::string>();
        //if ( selectedProcessor != processorName ) {
          SendStatus("Creating processor factory");
          auto processorFactory = SingletonFactory<std::function<std::unique_ptr<Processor>()>>::getInstance();
          SendStatus("Creating processor");
          std::unique_ptr<Processor> processor = processorFactory.getObject( selectedProcessor )();
          std::string processorName = selectedProcessor;
        //} else {
          SendStatus("Reusing processor");
        //}

        // Handle variables passed from JavaScript layer.
        if (dynamic_cast<EuglenaProcessor*>(processor.get()) != NULL) {
          memset(((EuglenaProcessor*)processor.get())->gameOverStr, 0, 80);
          std::strcpy(((EuglenaProcessor*)processor.get())->gameOverStr, var_dict["gameEndMsg"].as<std::string>().c_str());
          ((EuglenaProcessor*)processor.get())->gameInSession = var_dict["gameInSession"].as<bool>();
          ((EuglenaProcessor*)processor.get())->demoMode = var_dict["gameDemoMode"].as<bool>();
          ((EuglenaProcessor*)processor.get())->drawOnTrackedEuglena = var_dict["gameDrawOnTrackedEuglena"].as<bool>();
          // drawCircle
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterX, var_dict["drawCircleCenterX"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterY, var_dict["drawCircleCenterY"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleRadius, var_dict["drawCircleRadius"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleR, var_dict["drawCircleR"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleG, var_dict["drawCircleG"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleB, var_dict["drawCircleB"].as<std::string>().c_str());
          // drawLine
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX1, var_dict["drawLineX1"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY1, var_dict["drawLineY1"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX2, var_dict["drawLineX2"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY2, var_dict["drawLineY2"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineR, var_dict["drawLineR"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineG, var_dict["drawLineG"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineB, var_dict["drawLineB"].as<std::string>().c_str());
          // drawRect
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftX, var_dict["drawRectUpperLeftX"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftY, var_dict["drawRectUpperLeftY"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightX, var_dict["drawRectLowerRightX"].as<std::string>().c_str()); 
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightY, var_dict["drawRectLowerRightY"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectR, var_dict["drawRectR"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectG, var_dict["drawRectG"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectB, var_dict["drawRectB"].as<std::string>().c_str());
          // drawText
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextdrawTxt, var_dict["drawTextdrawTxt"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextXPos, var_dict["drawTextXPos"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextYPos, var_dict["drawTextYPos"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextSize, var_dict["drawTextSize"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextR, var_dict["drawTextR"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextG, var_dict["drawTextG"].as<std::string>().c_str());
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextB, var_dict["drawTextB"].as<std::string>().c_str());
          // getEuglenaInRect
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftX = var_dict["getEuglenaInRectUpperLeftX"].as<double>();
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftY = var_dict["getEuglenaInRectUpperLeftY"].as<double>();
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightX = var_dict["getEuglenaInRectLowerRightX"].as<double>();
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightY = var_dict["getEuglenaInRectLowerRightY"].as<double>();
          // getEuglenaPositionByID
          ((EuglenaProcessor*)processor.get())->positionID = var_dict["getEuglenaPositionID"].as<int>();
          // getEuglenaVelocityByID
          ((EuglenaProcessor*)processor.get())->velocityID = var_dict["getEuglenaVelocityID"].as<int>();
          // getEuglenaAccelerationByID
          ((EuglenaProcessor*)processor.get())->accelerationID = var_dict["getEuglenaAccelerationID"].as<int>();
          // getEuglenaRotationByID
          ((EuglenaProcessor*)processor.get())->rotationID = var_dict["getEuglenaAccelerationID"].as<int>();

          ((EuglenaProcessor*)processor.get())->magnification = var_dict["magnification"].as<int>();
          ((EuglenaProcessor*)processor.get())->sandboxMode = var_dict["sandboxMode"].as<bool>();
          ((EuglenaProcessor*)processor.get())->sandboxVideo = var_dict["sandboxVideo"].as<bool>();
          ((EuglenaProcessor*)processor.get())->sandboxVideoHasRecorded = var_dict["sandboxVideoHasRecorded"].as<bool>();
          ((EuglenaProcessor*)processor.get())->joystickIntensity = var_dict["joystickIntensity"].as<int>();
          ((EuglenaProcessor*)processor.get())->joystickDirection = var_dict["joystickDirection"].as<int>();
        }

        // Post message with C++ variables back to JavaScript layer.
        
        // TOdo: set a global val here, instead of posting it back.
        /*val msg = val::global("Object");
        msg["Type"] = "gamedata";
        msg["TotalEuglena"] = ((EuglenaProcessor*)processor.get())->totalEuglena;
        msg["EuglenaInRect"] = ((EuglenaProcessor*)processor.get())->getEuglenaInRectReturnVal;
        msg["EuglenaPositionsStr"] = ((EuglenaProcessor*)processor.get())->getAllEuglenaPositionsStr;
        msg["EuglenaIDsStr"] = ((EuglenaProcessor*)processor.get())->getAllEuglenaIDsStr;
        msg["EuglenaAccelerationReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaAccelerationStr;
        msg["EuglenaPositionReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaPositionStr;
        msg["EuglenaVelocityReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaVelocityStr;
        msg["EuglenaRotationReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaRotationStr;*/
        postMessageToBrowser( "MESSAGE" );

        // Convert data to CMat
        // SendStatus("Casting to byte array");
        // uint8_t* byteData = static_cast<uint8_t*>(data.Map());
        
        //uint8_t* byteData = (uint8_t*)atoi(data.c_str()); //reinterpret_cast<uint8_t*>(data.data());

        // SendStatus("Creating cv::Mat");
        auto Img = cv::Mat(height, width, CV_8UC4, byteData );
        // SendStatus("Calling processing");
        
        // Special case: Smiley
        /*if ( selectedProcessor == "Smiley!" ) {
          pp::VarDictionary sm_var_dict( var_dict["args"]);
          auto sm_width  = sm_var_dict["width"]);
          auto sm_height = sm_var_dict["height"]);
          auto sm_data   = pp::VarArrayBuffer( sm_var_dict["data"] );
          uint8_t* sm_byteData = static_cast<uint8_t*>(sm_data.Map());
          auto sm_Img = cv::Mat(sm_height, sm_width, CV_8UC4, sm_byteData );
          processor->init( sm_Img );
        }*/

        
        //to uncomment:
        //Process( Img, processor );

      }


}

}

/*

  void HandleMessageOld(const std::string& message_str, const std::string& data) {
    // Called by javascript every frame.
    
    auto var_dict = (message_str);
    
    std::string cmd = var_dict["cmd"];
      if ( cmd == "process" ) {

        // Message is number of simulations to run
        int width  = var_dict["width"];
        int height =  var_dict["height"];

        // comm. for now:
        //std::string dataStr = var_dict["data"] ;
        // auto data = pp::VarArrayBuffer( dataStr ); // for now


        std::string selectedProcessor = var_dict["processor"];
        //if ( selectedProcessor != processorName ) {
          SendStatus("Creating processor factory");
          auto processorFactory = SingletonFactory<std::function<std::unique_ptr<Processor>()>>::getInstance();
          SendStatus("Creating processor");
          std::unique_ptr<Processor> processor = processorFactory.getObject( selectedProcessor )();
          std::string processorName = selectedProcessor;
        //} else {
          SendStatus("Reusing processor");
        //}

        // Handle variables passed from JavaScript layer.
        if (dynamic_cast<EuglenaProcessor*>(processor.get()) != NULL) {
          memset(((EuglenaProcessor*)processor.get())->gameOverStr, 0, 80);
          std::strcpy(((EuglenaProcessor*)processor.get())->gameOverStr, var_dict["gameEndMsg"]));
          ((EuglenaProcessor*)processor.get())->gameInSession = var_dict["gameInSession"]);
          ((EuglenaProcessor*)processor.get())->demoMode = var_dict["gameDemoMode"]);
          ((EuglenaProcessor*)processor.get())->drawOnTrackedEuglena = var_dict["gameDrawOnTrackedEuglena"]);
          // drawCircle
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterX, var_dict["drawCircleCenterX"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterY, var_dict["drawCircleCenterY"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleRadius, var_dict["drawCircleRadius"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleR, var_dict["drawCircleR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleG, var_dict["drawCircleG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleB, var_dict["drawCircleB"]));
          // drawLine
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX1, var_dict["drawLineX1"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY1, var_dict["drawLineY1"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX2, var_dict["drawLineX2"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY2, var_dict["drawLineY2"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineR, var_dict["drawLineR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineG, var_dict["drawLineG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineB, var_dict["drawLineB"]));
          // drawRect
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftX, var_dict["drawRectUpperLeftX"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftY, var_dict["drawRectUpperLeftY"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightX, var_dict["drawRectLowerRightX"])); 
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightY, var_dict["drawRectLowerRightY"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectR, var_dict["drawRectR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectG, var_dict["drawRectG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectB, var_dict["drawRectB"]));
          // drawText
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextdrawTxt, var_dict["drawTextdrawTxt"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextXPos, var_dict["drawTextXPos"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextYPos, var_dict["drawTextYPos"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextSize, var_dict["drawTextSize"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextR, var_dict["drawTextR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextG, var_dict["drawTextG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextB, var_dict["drawTextB"]));
          // getEuglenaInRect
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftX = var_dict["getEuglenaInRectUpperLeftX"]);
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftY = var_dict["getEuglenaInRectUpperLeftY"]);
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightX = var_dict["getEuglenaInRectLowerRightX"]);
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightY = var_dict["getEuglenaInRectLowerRightY"]);
          // getEuglenaPositionByID
          ((EuglenaProcessor*)processor.get())->positionID = var_dict["getEuglenaPositionID"]);
          // getEuglenaVelocityByID
          ((EuglenaProcessor*)processor.get())->velocityID = var_dict["getEuglenaVelocityID"]);
          // getEuglenaAccelerationByID
          ((EuglenaProcessor*)processor.get())->accelerationID = var_dict["getEuglenaAccelerationID"]);
          // getEuglenaRotationByID
          ((EuglenaProcessor*)processor.get())->rotationID = var_dict["getEuglenaAccelerationID"]);

          ((EuglenaProcessor*)processor.get())->magnification = var_dict["magnification"]);
          ((EuglenaProcessor*)processor.get())->sandboxMode = var_dict["sandboxMode"]);
          ((EuglenaProcessor*)processor.get())->sandboxVideo = var_dict["sandboxVideo"]);
          ((EuglenaProcessor*)processor.get())->sandboxVideoHasRecorded = var_dict["sandboxVideoHasRecorded"]);
          ((EuglenaProcessor*)processor.get())->joystickIntensity = var_dict["joystickIntensity"]);
          ((EuglenaProcessor*)processor.get())->joystickDirection = var_dict["joystickDirection"]);
        }

        // Post message with C++ variables back to JavaScript layer.
        val msg;
        msg["Type"] = "gamedata";
        msg["TotalEuglena"] = ((EuglenaProcessor*)processor.get())->totalEuglena;
        msg["EuglenaInRect"] = ((EuglenaProcessor*)processor.get())->getEuglenaInRectReturnVal;
        msg["EuglenaPositionsStr"] = ((EuglenaProcessor*)processor.get())->getAllEuglenaPositionsStr;
        msg["EuglenaIDsStr"] = ((EuglenaProcessor*)processor.get())->getAllEuglenaIDsStr;
        msg["EuglenaAccelerationReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaAccelerationStr;
        msg["EuglenaPositionReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaPositionStr;
        msg["EuglenaVelocityReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaVelocityStr;
        msg["EuglenaRotationReturn"] = ((EuglenaProcessor*)processor.get())->targetEuglenaRotationStr;
        PostMessage( msg );

        // Convert data to CMat
        // SendStatus("Casting to byte array");
        // uint8_t* byteData = static_cast<uint8_t*>(data.Map());
        uint8_t* byteData = (uint8_t*)atoi(data.c_str()); //reinterpret_cast<uint8_t*>(data.data());

        // SendStatus("Creating cv::Mat");
        auto Img = cv::Mat(height, width, CV_8UC4, byteData );
        // SendStatus("Calling processing");
        
        // Special case: Smiley
        //if ( selectedProcessor == "Smiley!" ) {
         // pp::VarDictionary sm_var_dict( var_dict["args"]);
        //  auto sm_width  = sm_var_dict["width"]);
        //  auto sm_height = sm_var_dict["height"]);
         // auto sm_data   = pp::VarArrayBuffer( sm_var_dict["data"] );
         // uint8_t* sm_byteData = static_cast<uint8_t*>(sm_data.Map());
         // auto sm_Img = cv::Mat(sm_height, sm_width, CV_8UC4, sm_byteData );
         // processor->init( sm_Img );
        //}

        drawBufferToCanvas(data);
        //to uncomment:
        //Process( Img, processor );

      } else if ( cmd == "test" ) {
        PostTest();
      } else if ( cmd == "echo" ) {
          std::string dataStr = var_dict["data"] ;
          //auto data = pp::VarArrayBuffer( dataStr );
          auto data = dataStr;
          // auto result = data.is_array_buffer();
          json msg;
          msg["Type"] = "completed";
          //msg["Data"] = dataStr ;
          drawBufferToCanvas(data);
          PostMessage( msg );
      } else if ( cmd == "load" ) {
        
        // Load resource URL
        //std::string url = var_dict[ "url" ];
        //URLLoaderHandler* handler = URLLoaderHandler::Create(this, url);
        //if (handler != NULL) {
          // Starts asynchronous download. When download is finished or when an
          // error occurs, |handler| posts the results back to the browser
          // vis PostMessage and self-destroys.
        //  handler->Start();
       // }
        
      } else if ( cmd == "hello123" ) {
      } else {
        // Disable simulation - background thread will see this at start of
        // next iteration and terminate early
        run_simulation_ = false;
      }
    
  }


  std::string bufferToString(char* buffer, int bufflen)
{
    std::string ret(buffer, bufflen);

    return ret;
}
*/

/*void Process( cv::Mat im, std::unique_ptr<Processor>& processor) 
{
  auto result = (*processor)( im );
  auto nBytes = result.elemSize() * result.total();
  pp::VarArrayBuffer data(nBytes);
  uint8_t* copy = static_cast<uint8_t*>( data.Map());
  memcpy( copy, result.data, nBytes );

  json msg;
  msg["Type"] = "completed";
  //msg["Data"] = bufferToString(data);
  drawBufferToCanvas(result.data);
  PostMessage( msg );
}*/

/*
void PostTest() 
{
  json msg;
  msg["Type"] = "completed";
  msg["Data"] =  "Processed ok";
  PostMessage( msg );
}*/



/*
pp::Module* pp::CreateModule() 
{
  return new InstanceFactory<ImageProcInstance>();
}

void ImageProcInstance::Process( cv::Mat im) 
{
  auto result = (*processor)( im );
  auto nBytes = result.elemSize() * result.total();
  pp::VarDictionary msg;
  pp::VarArrayBuffer data(nBytes);
  uint8_t* copy = static_cast<uint8_t*>( data.Map());
  memcpy( copy, result.data, nBytes );

  msg["Type", "completed" );
  msg["Data", data );
  PostMessage( msg );
}

void ImageProcInstance::PostTest() 
{
  pp::VarDictionary msg;
  msg["Type", "completed" );
  msg["Data", "Processed ok" );
  PostMessage( msg );
}

void ImageProcInstance::SendStatus(const std::string& status) 
{
  pp::VarDictionary msg;
  msg["Type", "status" );
  msg["Message", status );
  PostMessage( msg );
}


void ImageProcInstance::HandleMessage( const pp::Var& var_message ) 
{

  // Interface: receive a { cmd: ..., args... } dictionary  
  pp::VarDictionary var_dict( var_message );
  auto cmd = var_dict.Get( "cmd" ).AsString();
  if ( cmd == "process" ) {

    // Message is number of simulations to run
    auto width  = var_dict.Get("width").AsInt();
    auto height = var_dict.Get("height").AsInt();
    auto data   = pp::VarArrayBuffer( var_dict.Get("data") );
    auto selectedProcessor = var_dict.Get("processor").AsString();
    if ( selectedProcessor != processorName ) {
      SendStatus("Creating processor factory");
      auto processorFactory = SingletonFactory<std::function<std::unique_ptr<Processor>()>>::getInstance();
      SendStatus("Creating processor");
      processor = processorFactory.getObject( selectedProcessor )();
      processorName = selectedProcessor;
    } else {
      SendStatus("Reusing processor");
    }

    // Handle variables passed from JavaScript layer.
    if (dynamic_cast<EuglenaProcessor*>(processor.get()) != NULL) {
      memset(((EuglenaProcessor*)processor.get())->gameOverStr, 0, 80);
      std::strcpy(((EuglenaProcessor*)processor.get())->gameOverStr, var_dict.Get("gameEndMsg").AsString().c_str());
      ((EuglenaProcessor*)processor.get())->gameInSession = var_dict.Get("gameInSession").A
      ((EuglenaProcessor*)processor.get())->demoMode = var_dict.Get("gameDemoMode").A
      ((EuglenaProcessor*)processor.get())->drawOnTrackedEuglena = var_dict.Get("gameDrawOnTrackedEuglena").A
      // drawCircle
      std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterX, var_dict.Get("drawCircleCenterX").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterY, var_dict.Get("drawCircleCenterY").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleRadius, var_dict.Get("drawCircleRadius").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleR, var_dict.Get("drawCircleR").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleG, var_dict.Get("drawCircleG").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleB, var_dict.Get("drawCircleB").AsString().c_str());
      // drawLine
      std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX1, var_dict.Get("drawLineX1").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY1, var_dict.Get("drawLineY1").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX2, var_dict.Get("drawLineX2").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY2, var_dict.Get("drawLineY2").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawLineR, var_dict.Get("drawLineR").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawLineG, var_dict.Get("drawLineG").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawLineB, var_dict.Get("drawLineB").AsString().c_str());
      // drawRect
      std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftX, var_dict.Get("drawRectUpperLeftX").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftY, var_dict.Get("drawRectUpperLeftY").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightX, var_dict.Get("drawRectLowerRightX").AsString().c_str()); 
      std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightY, var_dict.Get("drawRectLowerRightY").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawRectR, var_dict.Get("drawRectR").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawRectG, var_dict.Get("drawRectG").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawRectB, var_dict.Get("drawRectB").AsString().c_str());
      // drawText
      std::strcpy(((EuglenaProcessor*)processor.get())->drawTextdrawTxt, var_dict.Get("drawTextdrawTxt").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawTextXPos, var_dict.Get("drawTextXPos").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawTextYPos, var_dict.Get("drawTextYPos").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawTextSize, var_dict.Get("drawTextSize").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawTextR, var_dict.Get("drawTextR").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawTextG, var_dict.Get("drawTextG").AsString().c_str());
      std::strcpy(((EuglenaProcessor*)processor.get())->drawTextB, var_dict.Get("drawTextB").AsString().c_str());
      // getEuglenaInRect
      ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftX = var_dict.Get("getEuglenaInRectUpperLeftX").AsDouble();
      ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftY = var_dict.Get("getEuglenaInRectUpperLeftY").AsDouble();
      ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightX = var_dict.Get("getEuglenaInRectLowerRightX").AsDouble();
      ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightY = var_dict.Get("getEuglenaInRectLowerRightY").AsDouble();
      // getEuglenaPositionByID
      ((EuglenaProcessor*)processor.get())->positionID = var_dict.Get("getEuglenaPositionID").AsInt();
      // getEuglenaVelocityByID
      ((EuglenaProcessor*)processor.get())->velocityID = var_dict.Get("getEuglenaVelocityID").AsInt();
      // getEuglenaAccelerationByID
      ((EuglenaProcessor*)processor.get())->accelerationID = var_dict.Get("getEuglenaAccelerationID").AsInt();
      // getEuglenaRotationByID
      ((EuglenaProcessor*)processor.get())->rotationID = var_dict.Get("getEuglenaAccelerationID").AsInt();

      ((EuglenaProcessor*)processor.get())->magnification = var_dict.Get("magnification").AsInt();
      ((EuglenaProcessor*)processor.get())->sandboxMode = var_dict.Get("sandboxMode").A
      ((EuglenaProcessor*)processor.get())->sandboxVideo = var_dict.Get("sandboxVideo").A
      ((EuglenaProcessor*)processor.get())->sandboxVideoHasRecorded = var_dict.Get("sandboxVideoHasRecorded").A
      ((EuglenaProcessor*)processor.get())->joystickIntensity = var_dict.Get("joystickIntensity").AsInt();
      ((EuglenaProcessor*)processor.get())->joystickDirection = var_dict.Get("joystickDirection").AsInt();
    }

    // Post message with C++ variables back to JavaScript layer.
    pp::VarDictionary msg;
    msg["Type", "gamedata" );
    msg["TotalEuglena", ((EuglenaProcessor*)processor.get())->totalEuglena );
    msg["EuglenaInRect", ((EuglenaProcessor*)processor.get())->getEuglenaInRectReturnVal );
    msg["EuglenaPositionsStr", ((EuglenaProcessor*)processor.get())->getAllEuglenaPositionsStr );
    msg["EuglenaIDsStr", ((EuglenaProcessor*)processor.get())->getAllEuglenaIDsStr );
    msg["EuglenaAccelerationReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaAccelerationStr );
    msg["EuglenaPositionReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaPositionStr );
    msg["EuglenaVelocityReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaVelocityStr );
    msg["EuglenaRotationReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaRotationStr );
    PostMessage( msg );

    // Convert data to CMat
    // SendStatus("Casting to byte array");
    uint8_t* byteData = static_cast<uint8_t*>(data.Map());
    // SendStatus("Creating cv::Mat");
    auto Img = cv::Mat(height, width, CV_8UC4, byteData );
    // SendStatus("Calling processing");
    
    // Special case: Smiley
    if ( selectedProcessor == "Smiley!" ) {
      pp::VarDictionary sm_var_dict( var_dict.Get( "args" ));
      auto sm_width  = sm_var_dict.Get("width").AsInt();
      auto sm_height = sm_var_dict.Get("height").AsInt();
      auto sm_data   = pp::VarArrayBuffer( sm_var_dict.Get("data") );
      uint8_t* sm_byteData = static_cast<uint8_t*>(sm_data.Map());
      auto sm_Img = cv::Mat(sm_height, sm_width, CV_8UC4, sm_byteData );
      processor->init( sm_Img );
    }
    Process( Img );
  } else if ( cmd == "test" ) {
    PostTest();
  } else if ( cmd == "echo" ) {
      auto data = pp::VarArrayBuffer( var_dict.Get("data") );
      // auto result = data.is_array_buffer();
      pp::VarDictionary msg;
      msg["Type", "completed" );
      msg["Data", data );
      PostMessage( msg );
  } else if ( cmd == "load" ) {
    // Load resource URL
    auto url = var_dict.Get( "url" ).AsString();
    URLLoaderHandler* handler = URLLoaderHandler::Create(this, url);
    if (handler != NULL) {
      // Starts asynchronous download. When download is finished or when an
      // error occurs, |handler| posts the results back to the browser
      // vis PostMessage and self-destroys.
      handler->Start();
    }
  } else if ( cmd == "hello123" ) {
  } else {
    // Disable simulation - background thread will see this at start of
    // next iteration and terminate early
    run_simulation_ = false;
  }
}

*/
#include "improc_instance.hpp"
#include "singleton_factory.hpp"
#include "url_loader_handler.hpp"
#include "processor_euglena.cpp"
#include <vector>
#include <thread>
#include <functional>
#include <emscripten.h>
#include <string>
#include "json.hpp"

using json = nlohmann::json;

  void postMessageToBrowser(const std::string& msg);
  void PostTest();
  void Process( cv::Mat im, std::unique_ptr<Processor>& processor);

  void postMessageToBrowser(const std::string& msg) {
    EM_ASM_({
      console.log(UTF8ToString($0));
    }, msg.c_str());
  }

  void SendStatus(const std::string& msg) {
    return postMessageToBrowser(msg);
  }

  void PostMessage(const json& msg) {
    return PostMessage(msg.dump());
  }
template<class S>
  const char* getCString(S variable) {
    std::string variableString = variable;
    return variableString.c_str();
  }

template<class I>
  const int getInt(I variable) {
    int variableInt  = variable;
    return variableInt;
  }
template<class D>
  const double getDouble(D variable) {
    double variableDouble = variable;
    return variableDouble;
  }
template<class B>
  const bool getBool(B variable) {
    bool variableBool = variable;
    return variableBool;
  }

  void drawBufferToCanvas(pp::VarArrayBuffer buffer) {
    EM_ASM_({
      console.log(buffer);
    }, buffer);
  }
bool run_simulation_ = false;
  void HandleMessage(const std::string& message_str) {
    /* Called by javascript every frame.
    */
    auto var_dict = json::parse(message_str);
    
    std::string cmd = var_dict["cmd"];
      if ( cmd == "process" ) {

        // Message is number of simulations to run
        int width  = var_dict["width"];
        int height =  var_dict["height"];
        std::string dataStr = var_dict["data"] ;
        auto data = pp::VarArrayBuffer( dataStr );
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
          std::strcpy(((EuglenaProcessor*)processor.get())->gameOverStr, getCString(var_dict["gameEndMsg"]));
          ((EuglenaProcessor*)processor.get())->gameInSession = getBool(var_dict["gameInSession"]);
          ((EuglenaProcessor*)processor.get())->demoMode = getBool(var_dict["gameDemoMode"]);
          ((EuglenaProcessor*)processor.get())->drawOnTrackedEuglena = getBool(var_dict["gameDrawOnTrackedEuglena"]);
          // drawCircle
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterX, getCString(var_dict["drawCircleCenterX"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleCenterY, getCString(var_dict["drawCircleCenterY"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleRadius, getCString(var_dict["drawCircleRadius"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleR, getCString(var_dict["drawCircleR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleG, getCString(var_dict["drawCircleG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawCircleB, getCString(var_dict["drawCircleB"]));
          // drawLine
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX1, getCString(var_dict["drawLineX1"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY1, getCString(var_dict["drawLineY1"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineX2, getCString(var_dict["drawLineX2"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineY2, getCString(var_dict["drawLineY2"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineR, getCString(var_dict["drawLineR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineG, getCString(var_dict["drawLineG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawLineB, getCString(var_dict["drawLineB"]));
          // drawRect
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftX, getCString(var_dict["drawRectUpperLeftX"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectUpperLeftY, getCString(var_dict["drawRectUpperLeftY"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightX, getCString(var_dict["drawRectLowerRightX"])); 
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectLowerRightY, getCString(var_dict["drawRectLowerRightY"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectR, getCString(var_dict["drawRectR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectG, getCString(var_dict["drawRectG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawRectB, getCString(var_dict["drawRectB"]));
          // drawText
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextdrawTxt, getCString(var_dict["drawTextdrawTxt"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextXPos, getCString(var_dict["drawTextXPos"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextYPos, getCString(var_dict["drawTextYPos"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextSize, getCString(var_dict["drawTextSize"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextR, getCString(var_dict["drawTextR"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextG, getCString(var_dict["drawTextG"]));
          std::strcpy(((EuglenaProcessor*)processor.get())->drawTextB, getCString(var_dict["drawTextB"]));
          // getEuglenaInRect
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftX = getDouble(var_dict["getEuglenaInRectUpperLeftX"]);
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectUpperLeftY = getDouble(var_dict["getEuglenaInRectUpperLeftY"]);
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightX = getDouble(var_dict["getEuglenaInRectLowerRightX"]);
          ((EuglenaProcessor*)processor.get())->getEuglenaInRectLowerRightY = getDouble(var_dict["getEuglenaInRectLowerRightY"]);
          // getEuglenaPositionByID
          ((EuglenaProcessor*)processor.get())->positionID = getInt(var_dict["getEuglenaPositionID"]);
          // getEuglenaVelocityByID
          ((EuglenaProcessor*)processor.get())->velocityID = getInt(var_dict["getEuglenaVelocityID"]);
          // getEuglenaAccelerationByID
          ((EuglenaProcessor*)processor.get())->accelerationID = getInt(var_dict["getEuglenaAccelerationID"]);
          // getEuglenaRotationByID
          ((EuglenaProcessor*)processor.get())->rotationID = getInt(var_dict["getEuglenaAccelerationID"]);

          ((EuglenaProcessor*)processor.get())->magnification = getInt(var_dict["magnification"]);
          ((EuglenaProcessor*)processor.get())->sandboxMode = getBool(var_dict["sandboxMode"]);
          ((EuglenaProcessor*)processor.get())->sandboxVideo = getBool(var_dict["sandboxVideo"]);
          ((EuglenaProcessor*)processor.get())->sandboxVideoHasRecorded = getBool(var_dict["sandboxVideoHasRecorded"]);
          ((EuglenaProcessor*)processor.get())->joystickIntensity = getInt(var_dict["joystickIntensity"]);
          ((EuglenaProcessor*)processor.get())->joystickDirection = getInt(var_dict["joystickDirection"]);
        }

        // Post message with C++ variables back to JavaScript layer.
        json msg;
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
        uint8_t* byteData = static_cast<uint8_t*>(data.Map());
        // SendStatus("Creating cv::Mat");
        auto Img = cv::Mat(height, width, CV_8UC4, byteData );
        // SendStatus("Calling processing");
        
        // Special case: Smiley
        /*if ( selectedProcessor == "Smiley!" ) {
          pp::VarDictionary sm_var_dict( var_dict["args"]);
          auto sm_width  = sm_getInt(var_dict["width"]);
          auto sm_height = sm_getInt(var_dict["height"]);
          auto sm_data   = pp::VarArrayBuffer( sm_var_dict["data"] );
          uint8_t* sm_byteData = static_cast<uint8_t*>(sm_data.Map());
          auto sm_Img = cv::Mat(sm_height, sm_width, CV_8UC4, sm_byteData );
          processor->init( sm_Img );
        }*/
        Process( Img, processor );
      } else if ( cmd == "test" ) {
        PostTest();
      } else if ( cmd == "echo" ) {
          std::string dataStr = var_dict["data"] ;
          auto data = pp::VarArrayBuffer( dataStr );
          // auto result = data.is_array_buffer();
          json msg;
          msg["Type"] = "completed";
          //msg["Data"] = dataStr ;
          drawBufferToCanvas(data);
          PostMessage( msg );
      } else if ( cmd == "load" ) {
        /*
        // Load resource URL
        std::string url = var_dict[ "url" ];
        URLLoaderHandler* handler = URLLoaderHandler::Create(this, url);
        if (handler != NULL) {
          // Starts asynchronous download. When download is finished or when an
          // error occurs, |handler| posts the results back to the browser
          // vis PostMessage and self-destroys.
          handler->Start();
        }
        */
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

void Process( cv::Mat im, std::unique_ptr<Processor>& processor) 
{
  auto result = (*processor)( im );
  auto nBytes = result.elemSize() * result.total();
  pp::VarArrayBuffer data(nBytes);
  uint8_t* copy = static_cast<uint8_t*>( data.Map());
  memcpy( copy, result.data, nBytes );

  json msg;
  msg["Type"] = "completed";
  //msg["Data"] = bufferToString(data);
  drawBufferToCanvas(data);
  PostMessage( msg );
}

void PostTest() 
{
  json msg;
  msg["Type"] = "completed";
  msg["Data"] =  "Processed ok";
  PostMessage( msg );
}


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
      ((EuglenaProcessor*)processor.get())->gameInSession = var_dict.Get("gameInSession").AsBool();
      ((EuglenaProcessor*)processor.get())->demoMode = var_dict.Get("gameDemoMode").AsBool();
      ((EuglenaProcessor*)processor.get())->drawOnTrackedEuglena = var_dict.Get("gameDrawOnTrackedEuglena").AsBool();
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
      ((EuglenaProcessor*)processor.get())->sandboxMode = var_dict.Get("sandboxMode").AsBool();
      ((EuglenaProcessor*)processor.get())->sandboxVideo = var_dict.Get("sandboxVideo").AsBool();
      ((EuglenaProcessor*)processor.get())->sandboxVideoHasRecorded = var_dict.Get("sandboxVideoHasRecorded").AsBool();
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
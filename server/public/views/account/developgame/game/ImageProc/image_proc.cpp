#include "improc_instance.hpp"
#include "singleton_factory.hpp"
#include "url_loader_handler.hpp"
#include "processor_euglena.cpp"
#include <vector>
#include <thread>
#include <functional>

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

  msg.Set( "Type", "completed" );
  msg.Set( "Data", data );
  PostMessage( msg );
}

void ImageProcInstance::PostTest() 
{
  pp::VarDictionary msg;
  msg.Set( "Type", "completed" );
  msg.Set( "Data", "Processed ok" );
  PostMessage( msg );
}

void ImageProcInstance::SendStatus(const std::string& status) 
{
  pp::VarDictionary msg;
  msg.Set( "Type", "status" );
  msg.Set( "Message", status );
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
    }

    // Post message with C++ variables back to JavaScript layer.
    pp::VarDictionary msg;
    msg.Set( "Type", "gamedata" );
    msg.Set( "TotalEuglena", ((EuglenaProcessor*)processor.get())->totalEuglena );
    msg.Set( "EuglenaInRect", ((EuglenaProcessor*)processor.get())->getEuglenaInRectReturnVal );
    msg.Set( "EuglenaPositionsStr", ((EuglenaProcessor*)processor.get())->getAllEuglenaPositionsStr );
    msg.Set( "EuglenaIDsStr", ((EuglenaProcessor*)processor.get())->getAllEuglenaIDsStr );
    msg.Set( "EuglenaAccelerationReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaAcceleration );
    msg.Set( "EuglenaPositionReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaPositionStr );
    msg.Set( "EuglenaVelocityReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaVelocity );
    msg.Set( "EuglenaRotationReturn", ((EuglenaProcessor*)processor.get())->targetEuglenaRotation );
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
      msg.Set( "Type", "completed" );
      msg.Set( "Data", data );
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

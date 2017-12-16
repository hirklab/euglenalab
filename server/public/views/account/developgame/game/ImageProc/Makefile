# Project Build flags
WARNINGS := -Wno-long-long -Wall -Wswitch-enum -pedantic -Werror
CXXFLAGS := -pthread -std=gnu++11 $(WARNINGS)

#
# Compute tool paths
#
GETOS := python $(NACL_SDK_ROOT)/tools/getos.py
OSHELPERS = python $(NACL_SDK_ROOT)/tools/oshelpers.py
OSNAME := $(shell $(GETOS))
RM := $(OSHELPERS) rm

PNACL_TC_PATH := $(abspath $(NACL_SDK_ROOT)/toolchain/$(OSNAME)_pnacl)
PNACL_CXX := $(PNACL_TC_PATH)/bin/pnacl-clang++
PNACL_FINALIZE := $(PNACL_TC_PATH)/bin/pnacl-finalize
PNACL_COMPRESS := $(PNACL_TC_PATH)/bin/pnacl-compress
PNACL_CXXFLAGS := -O2 -I$(NACL_SDK_ROOT)/include $(CXXFLAGS)
LDFLAGS := -lopencv_video -lopencv_objdetect -lopencv_imgproc -lopencv_core -lz
PNACL_LDFLAGS := -L$(NACL_SDK_ROOT)/lib/pnacl/Release  -lppapi_cpp -lppapi -lpthread $(LDFLAGS)

#PROCESSORS := $(wildcard processor_*.cpp) url_loader_handler.cpp
PROCESSORS := processor_euglena.cpp url_loader_handler.cpp
PROC_OBJECTS := $(PROCESSORS:.cpp=.bc)

OBJ := $(addprefix $(build)/, $(subst src/,, $(patsubst %.cpp, %.o, $(wildcard src/*.cpp))))

IMPROC_HEADERS := image_proc.cpp image_proc.hpp instance_factory.hpp improc_instance.hpp singleton_factory.hpp

EMSCRIPTEN := ~/euglenalab/emsdk/emscripten/incoming/
OPENCV_DIR := /usr/local/include/
OPENCV_SRC_DIR := ~/Documents/opencv-3.3.1
OPENCV_BUILD_DIR := "./"
IMAGE_PROC_EXPORTED_FUNCTIONS = "['_HandleMessage']"
IMAGE_PROC_DEFAULT_LIBRARY_FUNCS_TO_INCLUDE = "['HandleMessage']"


# Declare the ALL target first, to make the 'all' target the default build
all: image_proc_wasm

# Create individual test
test:
	g++ -g -o test_display test_display.cpp $(PROC) -std=c++0x -lopencv_highgui -lopencv_imgcodecs $(LDFLAGS) 


test_processor: test_processor.cpp singleton_factory.hpp $(PROCESSORS)
	g++ -g -o test_processor test_processor.cpp $(PROCESSORS) -std=c++0x $(LDFLAGS)

clean:
	$(RM) image_proc.pexe image_proc.bc
	$(RM) ${PROC_OBJECTS}

#$(PROC_OBJECTS): $(PROCESSORS) singleton_factory.hpp
#	$(PNACL_CXX) -o $@ $< -O2 $(CXXFLAGS) $(LDFLAGS)

%.bc:%.cpp                                                                                                                                                            |   ~
	$(PNACL_CXX) -c $(PNACL_CXXFLAGS) -o $@ $<


# image_proc.bc:  $(IMPROC_HEADERS) $(PROCESSORS) url_loader_handler.cpp
# 	$(PNACL_CXX) -o $@ $< $(PROCESSORS) url_loader_handler.cpp -O3 $(PNACL_CXXFLAGS) $(PNACL_LDFLAGS)

image_proc.bc: $(PROC_OBJECTS)
	$(PNACL_CXX) -o $@ $(PROC_OBJECTS) $(PNACL_CXXFLAGS) image_proc.cpp $(PNACL_LDFLAGS) 
         
image_proc.pexe: image_proc.bc
	$(PNACL_FINALIZE) -o $@ $<
	$(PNACL_COMPRESS) -o image_proc.compressed.pexe image_proc.pexe

compile_opencv:
	cd opencv
	#cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE= $(EMSCRIPTEN)/cmake/Modules/Platform/Emscripten.cmake $(OPENCV_SRC_DIR) -Bopencv
	cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE='/home/mserver/euglenalab/emsdk/emscripten/incoming/cmake/Modules/Platform/Emscripten.cmake' -DCPU_BASELINE='' -DCPU_DISPATCH='' -DCV_TRACE=OFF -DBUILD_SHARED_LIBS=OFF -DWITH_1394=OFF -DWITH_VTK=OFF -DWITH_CUDA=OFF -DWITH_CUFFT=OFF -DWITH_CUBLAS=OFF -DWITH_NVCUVID=OFF -DWITH_EIGEN=OFF -DWITH_FFMPEG=OFF -DWITH_GSTREAMER=OFF -DWITH_GTK=OFF -DWITH_GTK_2_X=OFF -DWITH_IPP=OFF -DWITH_JASPER=OFF -DWITH_JPEG=OFF -DWITH_WEBP=OFF -DWITH_OPENEXR=OFF -DWITH_OPENGL=OFF -DWITH_OPENVX=OFF -DWITH_OPENNI=OFF -DWITH_OPENNI2=OFF -DWITH_PNG=OFF -DWITH_TBB=OFF -DWITH_PTHREADS_PF=OFF -DWITH_TIFF=OFF -DWITH_V4L=OFF -DWITH_OPENCL=OFF -DWITH_OPENCL_SVM=OFF -DWITH_OPENCLAMDFFT=OFF -DWITH_OPENCLAMDBLAS=OFF -DWITH_MATLAB=OFF -DWITH_GPHOTO2=OFF -DWITH_LAPACK=OFF -DWITH_ITT=OFF -DBUILD_ZLIB=ON -DBUILD_opencv_apps=OFF -DBUILD_opencv_calib3d=OFF -DBUILD_opencv_dnn=OFF -DBUILD_opencv_features2d=OFF -DBUILD_opencv_flann=OFF -DBUILD_opencv_ml=OFF -DBUILD_opencv_photo=OFF -DBUILD_opencv_imgcodecs=OFF -DBUILD_opencv_shape=OFF -DBUILD_opencv_videoio=OFF -DBUILD_opencv_videostab=OFF -DBUILD_opencv_highgui=OFF -DBUILD_opencv_superres=OFF -DBUILD_opencv_stitching=OFF -DBUILD_opencv_java=OFF -DBUILD_opencv_js=OFF -DBUILD_opencv_python2=OFF -DBUILD_opencv_python3=OFF -DBUILD_EXAMPLES=OFF -DBUILD_PACKAGE=OFF -DBUILD_TESTS=OFF -DBUILD_PERF_TESTS=OFF -DBUILD_DOCS=OFF opencv
	$(EMSCRIPTEN)/emmake make -C opencv
	#python $(OPENCV_SRC_DIR)/platforms/js/build_js.py opencv --build_wasm

image_proc_wasm:
	#$(EMSCRIPTEN)/emcc image_proc.cpp -s WASM=1 -o image_proc.html
	$(EMSCRIPTEN)/emcc image_proc.cpp -O0 -s WASM=1 --bind -o image_proc.js -I $(OPENCV_DIR) -std=c++11 -s EXPORTED_FUNCTIONS=$(IMAGE_PROC_EXPORTED_FUNCTIONS) -s DEFAULT_LIBRARY_FUNCS_TO_INCLUDE=$(IMAGE_PROC_DEFAULT_LIBRARY_FUNCS_TO_INCLUDE) -lopencv_video -lopencv_objdetect -lopencv_imgproc -lopencv_core -lz

serve:
	python -m SimpleHTTPServer 8000

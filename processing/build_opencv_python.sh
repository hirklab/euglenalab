#!/usr/bin/env bash

# For MacOS, please install OpenCV Python module seperately, this build may not work
OSX_SDK_VERSION="10.9"
export MACOSX_DEPLOYMENT_TARGET=${OSX_SDK_VERSION}

mkdir -p build-opencv
cd build-opencv

cmake \
    -DCMAKE_OSX_SYSROOT="/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX${OSX_SDK_VERSION}.sdk" \
    -D CMAKE_OSX_DEPLOYMENT_TARGET=${OSX_SDK_VERSION} \
    -D BUILD_PERF_TESTS=OFF \
    -D BUILD_TESTS=OFF \
    -D BUILD_PNG=ON \
    -D BUILD_opencv_java=OFF \
    -D BUILD_FAT_JAVA_LIB=OFF \
    -D BUILD_JPEG=ON \
    -D BUILD_TIFF=ON \
    -D WITH_OPENEXR=OFF \
    -D BUILD_ZLIB=ON \
    -D WITH_WEBP=OFF \
    -D WITH_OPENGL=OFF \
    -D WITH_OPENCL=OFF \
    -D WITH_CUDA=OFF \
    -D INSTALL_C_EXAMPLES=OFF \
	  -D CMAKE_INSTALL_PREFIX=/usr/local \
    -D BUILD_SHARED_LIBS=ON \
    -D CMAKE_BUILD_TYPE=RELEASE ../euglenatracer/opencv/

make -j 8
sudo make install

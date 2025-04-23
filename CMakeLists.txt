cmake_minimum_required(VERSION 3.10)
project(PaletteExtractor)

set(CMAKE_CXX_STANDARD 17)
add_library(palette STATIC src/palette.cpp src/palette.h)
target_include_directories(palette PRIVATE ./src)


add_subdirectory(examples/cli)


# 如果你要使用 Emscripten 构建：
# emcmake cmake . && emmake make
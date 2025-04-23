cmake_minimum_required(VERSION 3.10)

add_executable(palette_cli main.cpp)
target_link_libraries(palette_cli palette)
target_include_directories(palette_cli PRIVATE ../../src)

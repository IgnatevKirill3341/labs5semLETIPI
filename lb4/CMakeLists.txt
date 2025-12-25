cmake_minimum_required(VERSION 3.16)
project(pa4lab_opencl LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(OpenCL REQUIRED)

add_executable(pa4lab
    src/main.cpp
)

target_include_directories(pa4lab PRIVATE ${OpenCL_INCLUDE_DIRS})
target_link_libraries(pa4lab PRIVATE ${OpenCL_LIBRARIES})











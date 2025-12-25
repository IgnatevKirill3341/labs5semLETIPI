CXX = g++
CXXFLAGS = -std=c++11 -O2 -pthread -Wall -Wextra
TARGET = lb3
SOURCES = lb3.cpp

all: $(TARGET)

$(TARGET): $(SOURCES)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCES)

clean:
	rm -f $(TARGET)

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run




#include <cassert>
#include <chrono>
#include <future>
#include <iostream>
#include <random>
#include <thread>
#include <vector>

class Matrix {
private:
  std::vector<std::vector<double>> data;
  int rows, cols;

public:
  Matrix(int r, int c) : rows(r), cols(c), data(r, std::vector<double>(c, 0)) {}

  void randomize() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<> dis(0.0, 1.0);

    for (int i = 0; i < rows; ++i) {
      for (int j = 0; j < cols; ++j) {
        data[i][j] = dis(gen);
      }
    }
  }

  double &operator()(int i, int j) { return data[i][j]; }
  const double &operator()(int i, int j) const { return data[i][j]; }

  int getRows() const { return rows; }
  int getCols() const { return cols; }

  bool operator==(const Matrix &other) const {
    if (rows != other.rows || cols != other.cols)
      return false;
    for (int i = 0; i < rows; ++i) {
      for (int j = 0; j < cols; ++j) {
        if (std::abs(data[i][j] - other.data[i][j]) > 1e-6) {
          return false;
        }
      }
    }
    return true;
  }
};

Matrix multiply_sequential(const Matrix &A, const Matrix &B) {
  int n = A.getRows(), m = A.getCols(), p = B.getCols();
  Matrix result(n, p);

  for (int i = 0; i < n; ++i) {
    for (int j = 0; j < p; ++j) {
      double sum = 0;
      for (int k = 0; k < m; ++k) {
        sum += A(i, k) * B(k, j);
      }
      result(i, j) = sum;
    }
  }
  return result;
}

// 1.1 Реализация с std::thread
Matrix multiply_threads(const Matrix &A, const Matrix &B, int num_threads) {
  int n = A.getRows(), m = A.getCols(), p = B.getCols();
  Matrix result(n, p);
  std::vector<std::thread> threads;

  int block_size = (n + num_threads - 1) / num_threads;

  auto multiply_block = [&](int start_row, int end_row) {
    for (int i = start_row; i < end_row; ++i) {
      for (int j = 0; j < p; ++j) {
        double sum = 0;
        for (int k = 0; k < m; ++k) {
          sum += A(i, k) * B(k, j);
        }
        result(i, j) = sum;
      }
    }
  };

  for (int i = 0; i < num_threads; ++i) {
    int start_row = i * block_size;
    int end_row = std::min(start_row + block_size, n);
    threads.emplace_back(multiply_block, start_row, end_row);
  }

  for (auto &t : threads) {
    t.join();
  }

  return result;
}

// 1.2 Реализация с std::async
Matrix multiply_async(const Matrix &A, const Matrix &B, int num_threads) {
  int n = A.getRows(), m = A.getCols(), p = B.getCols();
  Matrix result(n, p);
  std::vector<std::future<void>> futures;

  int block_size = (n + num_threads - 1) / num_threads;

  auto multiply_block = [&](int start_row, int end_row) {
    for (int i = start_row; i < end_row; ++i) {
      for (int j = 0; j < p; ++j) {
        double sum = 0;
        for (int k = 0; k < m; ++k) {
          sum += A(i, k) * B(k, j);
        }
        result(i, j) = sum;
      }
    }
  };

  for (int i = 0; i < num_threads; ++i) {
    int start_row = i * block_size;
    int end_row = std::min(start_row + block_size, n);
    futures.push_back(
        std::async(std::launch::async, multiply_block, start_row, end_row));
  }

  for (auto &f : futures) {
    f.get();
  }

  return result;
}

// Функция для тестирования корректности
void test_correctness() {
  Matrix A(100, 50);
  Matrix B(50, 70);
  A.randomize();
  B.randomize();

  Matrix seq_result = multiply_sequential(A, B);
  Matrix thread_result = multiply_threads(A, B, 4);
  Matrix async_result = multiply_async(A, B, 4);

  assert(seq_result == thread_result);
  assert(seq_result == async_result);

  std::cout << "All tests passed!\n";
}

// Функция для измерения производительности
void benchmark() {
  std::vector<int> sizes = {100, 200, 500, 1000};
  std::vector<int> thread_counts = {1, 2, 4, 8, 16};

  for (int size : sizes) {
    Matrix A(size, size);
    Matrix B(size, size);
    A.randomize();
    B.randomize();

    std::cout << "\nMatrix size: " << size << "x" << size << "\n";

    // Sequential
    auto start = std::chrono::high_resolution_clock::now();
    multiply_sequential(A, B);
    auto end = std::chrono::high_resolution_clock::now();
    double sequential_time = std::chrono::duration<double>(end - start).count();
    std::cout << "Sequential: " << sequential_time << "s\n";

    // Threads
    for (int threads : thread_counts) {
      start = std::chrono::high_resolution_clock::now();
      multiply_threads(A, B, threads);
      end = std::chrono::high_resolution_clock::now();
      double time = std::chrono::duration<double>(end - start).count();
      std::cout << "Threads (" << threads << "): " << time
                << "s, Speedup: " << sequential_time / time << "\n";
    }

    // Async
    for (int threads : thread_counts) {
      start = std::chrono::high_resolution_clock::now();
      multiply_async(A, B, threads);
      end = std::chrono::high_resolution_clock::now();
      double time = std::chrono::duration<double>(end - start).count();
      std::cout << "Async (" << threads << "): " << time
                << "s, Speedup: " << sequential_time / time << "\n";
    }
  }
}

int main() {
  test_correctness();
  benchmark();
  return 0;
}

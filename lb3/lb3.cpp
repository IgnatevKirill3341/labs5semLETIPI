#include <algorithm>
#include <cassert>
#include <chrono>
#include <cmath>
#include <future>
#include <iostream>
#include <random>
#include <thread>
#include <vector>

// ============================================================================
// Matrix class (reused from lb1.cpp)
// ============================================================================
class Matrix {
private:
  std::vector<std::vector<double>> data;
  int rows, cols;

public:
  Matrix(int r, int c) : data(r, std::vector<double>(c, 0)), rows(r), cols(c) {}

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
        if (std::abs(data[i][j] - other.data[i][j]) > 1e-5) {
          return false;
        }
      }
    }
    return true;
  }

  // Helper methods for Strassen's algorithm
  Matrix getSubmatrix(int startRow, int endRow, int startCol, int endCol) const {
    Matrix sub(endRow - startRow, endCol - startCol);
    for (int i = 0; i < sub.rows; ++i) {
      for (int j = 0; j < sub.cols; ++j) {
        sub(i, j) = data[startRow + i][startCol + j];
      }
    }
    return sub;
  }

  void setSubmatrix(int startRow, int startCol, const Matrix &sub) {
    for (int i = 0; i < sub.rows; ++i) {
      for (int j = 0; j < sub.cols; ++j) {
        data[startRow + i][startCol + j] = sub(i, j);
      }
    }
  }

  Matrix operator+(const Matrix &other) const {
    assert(rows == other.rows && cols == other.cols);
    Matrix result(rows, cols);
    for (int i = 0; i < rows; ++i) {
      for (int j = 0; j < cols; ++j) {
        result(i, j) = data[i][j] + other.data[i][j];
      }
    }
    return result;
  }

  Matrix operator-(const Matrix &other) const {
    assert(rows == other.rows && cols == other.cols);
    Matrix result(rows, cols);
    for (int i = 0; i < rows; ++i) {
      for (int j = 0; j < cols; ++j) {
        result(i, j) = data[i][j] - other.data[i][j];
      }
    }
    return result;
  }
};

// Sequential matrix multiplication (from lb1.cpp)
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

// ============================================================================
// 3.1 Parallel Strassen's Algorithm
// ============================================================================

// Find next power of 2
int nextPowerOf2(int n) {
  int power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

// Pad matrix to power of 2 size
Matrix padMatrix(const Matrix &A, int size) {
  Matrix padded(size, size);
  for (int i = 0; i < A.getRows(); ++i) {
    for (int j = 0; j < A.getCols(); ++j) {
      padded(i, j) = A(i, j);
    }
  }
  return padded;
}

// Remove padding from matrix
Matrix unpadMatrix(const Matrix &A, int originalRows, int originalCols) {
  Matrix result(originalRows, originalCols);
  for (int i = 0; i < originalRows; ++i) {
    for (int j = 0; j < originalCols; ++j) {
      result(i, j) = A(i, j);
    }
  }
  return result;
}

// Sequential Strassen's algorithm (base case)
Matrix strassen_sequential(const Matrix &A, const Matrix &B) {
  int n = A.getRows();
  
  // Base case: use standard multiplication for small matrices
  if (n <= 64) {
    return multiply_sequential(A, B);
  }

  int half = n / 2;

  // Split matrices into quadrants
  Matrix A11 = A.getSubmatrix(0, half, 0, half);
  Matrix A12 = A.getSubmatrix(0, half, half, n);
  Matrix A21 = A.getSubmatrix(half, n, 0, half);
  Matrix A22 = A.getSubmatrix(half, n, half, n);

  Matrix B11 = B.getSubmatrix(0, half, 0, half);
  Matrix B12 = B.getSubmatrix(0, half, half, n);
  Matrix B21 = B.getSubmatrix(half, n, 0, half);
  Matrix B22 = B.getSubmatrix(half, n, half, n);

  // Calculate the 7 products
  Matrix M1 = strassen_sequential(A11 + A22, B11 + B22);
  Matrix M2 = strassen_sequential(A21 + A22, B11);
  Matrix M3 = strassen_sequential(A11, B12 - B22);
  Matrix M4 = strassen_sequential(A22, B21 - B11);
  Matrix M5 = strassen_sequential(A11 + A12, B22);
  Matrix M6 = strassen_sequential(A21 - A11, B11 + B12);
  Matrix M7 = strassen_sequential(A12 - A22, B21 + B22);

  // Calculate result quadrants
  Matrix C11 = M1 + M4 - M5 + M7;
  Matrix C12 = M3 + M5;
  Matrix C21 = M2 + M4;
  Matrix C22 = M1 - M2 + M3 + M6;

  // Combine quadrants
  Matrix result(n, n);
  result.setSubmatrix(0, 0, C11);
  result.setSubmatrix(0, half, C12);
  result.setSubmatrix(half, 0, C21);
  result.setSubmatrix(half, half, C22);

  return result;
}

// Parallel Strassen's algorithm
Matrix strassen_parallel(const Matrix &A, const Matrix &B, int max_depth = 0, int depth = 0) {
  int n = A.getRows();
  
  // Base case: use standard multiplication for small matrices
  if (n <= 64) {
    return multiply_sequential(A, B);
  }

  int half = n / 2;

  // Split matrices into quadrants
  Matrix A11 = A.getSubmatrix(0, half, 0, half);
  Matrix A12 = A.getSubmatrix(0, half, half, n);
  Matrix A21 = A.getSubmatrix(half, n, 0, half);
  Matrix A22 = A.getSubmatrix(half, n, half, n);

  Matrix B11 = B.getSubmatrix(0, half, 0, half);
  Matrix B12 = B.getSubmatrix(0, half, half, n);
  Matrix B21 = B.getSubmatrix(half, n, 0, half);
  Matrix B22 = B.getSubmatrix(half, n, half, n);

  // Prepare intermediate matrices
  Matrix A11_A22 = A11 + A22;
  Matrix B11_B22 = B11 + B22;
  Matrix A21_A22 = A21 + A22;
  Matrix B12_B22 = B12 - B22;
  Matrix B21_B11 = B21 - B11;
  Matrix A11_A12 = A11 + A12;
  Matrix A21_A11 = A21 - A11;
  Matrix B11_B12 = B11 + B12;
  Matrix A12_A22 = A12 - A22;
  Matrix B21_B22 = B21 + B22;

  // Calculate the 7 products in parallel if depth allows
  std::vector<std::future<Matrix>> futures;
  bool use_parallel = (max_depth == 0 || depth < max_depth);

  if (use_parallel) {
    futures.push_back(std::async(std::launch::async, strassen_parallel, A11_A22, B11_B22, max_depth, depth + 1));
    futures.push_back(std::async(std::launch::async, strassen_parallel, A21_A22, B11, max_depth, depth + 1));
    futures.push_back(std::async(std::launch::async, strassen_parallel, A11, B12_B22, max_depth, depth + 1));
    futures.push_back(std::async(std::launch::async, strassen_parallel, A22, B21_B11, max_depth, depth + 1));
    futures.push_back(std::async(std::launch::async, strassen_parallel, A11_A12, B22, max_depth, depth + 1));
    futures.push_back(std::async(std::launch::async, strassen_parallel, A21_A11, B11_B12, max_depth, depth + 1));
    futures.push_back(std::async(std::launch::async, strassen_parallel, A12_A22, B21_B22, max_depth, depth + 1));

    Matrix M1 = futures[0].get();
    Matrix M2 = futures[1].get();
    Matrix M3 = futures[2].get();
    Matrix M4 = futures[3].get();
    Matrix M5 = futures[4].get();
    Matrix M6 = futures[5].get();
    Matrix M7 = futures[6].get();

    // Calculate result quadrants
    Matrix C11 = M1 + M4 - M5 + M7;
    Matrix C12 = M3 + M5;
    Matrix C21 = M2 + M4;
    Matrix C22 = M1 - M2 + M3 + M6;

    // Combine quadrants
    Matrix result(n, n);
    result.setSubmatrix(0, 0, C11);
    result.setSubmatrix(0, half, C12);
    result.setSubmatrix(half, 0, C21);
    result.setSubmatrix(half, half, C22);

    return result;
  } else {
    // Sequential recursion
    Matrix M1 = strassen_parallel(A11_A22, B11_B22, max_depth, depth + 1);
    Matrix M2 = strassen_parallel(A21_A22, B11, max_depth, depth + 1);
    Matrix M3 = strassen_parallel(A11, B12_B22, max_depth, depth + 1);
    Matrix M4 = strassen_parallel(A22, B21_B11, max_depth, depth + 1);
    Matrix M5 = strassen_parallel(A11_A12, B22, max_depth, depth + 1);
    Matrix M6 = strassen_parallel(A21_A11, B11_B12, max_depth, depth + 1);
    Matrix M7 = strassen_parallel(A12_A22, B21_B22, max_depth, depth + 1);

    // Calculate result quadrants
    Matrix C11 = M1 + M4 - M5 + M7;
    Matrix C12 = M3 + M5;
    Matrix C21 = M2 + M4;
    Matrix C22 = M1 - M2 + M3 + M6;

    // Combine quadrants
    Matrix result(n, n);
    result.setSubmatrix(0, 0, C11);
    result.setSubmatrix(0, half, C12);
    result.setSubmatrix(half, 0, C21);
    result.setSubmatrix(half, half, C22);

    return result;
  }
}

// Wrapper function for Strassen's algorithm (handles non-square and non-power-of-2 matrices)
Matrix multiply_strassen(const Matrix &A, const Matrix &B, bool parallel = false, int max_depth = 2) {
  int n = A.getRows();
  int m = A.getCols();
  int p = B.getCols();

  // For non-square matrices, pad to square power-of-2
  int max_dim = std::max({n, m, p});
  int padded_size = nextPowerOf2(max_dim);

  Matrix A_padded = padMatrix(A, padded_size);
  Matrix B_padded = padMatrix(B, padded_size);

  Matrix result_padded = parallel 
    ? strassen_parallel(A_padded, B_padded, max_depth)
    : strassen_sequential(A_padded, B_padded);

  return unpadMatrix(result_padded, n, p);
}

// ============================================================================
// 3.2 Parallel Sorting Algorithm (Parallel Merge Sort)
// ============================================================================

// Sequential merge sort
void merge_sort_sequential(std::vector<double> &arr, int left, int right) {
  if (left >= right) return;

  int mid = left + (right - left) / 2;
  merge_sort_sequential(arr, left, mid);
  merge_sort_sequential(arr, mid + 1, right);

  // Merge
  std::vector<double> temp(right - left + 1);
  int i = left, j = mid + 1, k = 0;

  while (i <= mid && j <= right) {
    if (arr[i] <= arr[j]) {
      temp[k++] = arr[i++];
    } else {
      temp[k++] = arr[j++];
    }
  }

  while (i <= mid) temp[k++] = arr[i++];
  while (j <= right) temp[k++] = arr[j++];

  for (i = left, k = 0; i <= right; ++i, ++k) {
    arr[i] = temp[k];
  }
}

// Parallel merge sort
void merge_sort_parallel(std::vector<double> &arr, int left, int right, int max_depth = 0, int depth = 0) {
  if (left >= right) return;

  int mid = left + (right - left) / 2;
  bool use_parallel = (max_depth == 0 || depth < max_depth);

  if (use_parallel && (right - left) > 1000) {
    // Parallel recursion
    auto future = std::async(std::launch::async, merge_sort_parallel, std::ref(arr), left, mid, max_depth, depth + 1);
    merge_sort_parallel(arr, mid + 1, right, max_depth, depth + 1);
    future.get();
  } else {
    // Sequential recursion
    merge_sort_parallel(arr, left, mid, max_depth, depth + 1);
    merge_sort_parallel(arr, mid + 1, right, max_depth, depth + 1);
  }

  // Merge (always sequential for correctness)
  std::vector<double> temp(right - left + 1);
  int i = left, j = mid + 1, k = 0;

  while (i <= mid && j <= right) {
    if (arr[i] <= arr[j]) {
      temp[k++] = arr[i++];
    } else {
      temp[k++] = arr[j++];
    }
  }

  while (i <= mid) temp[k++] = arr[i++];
  while (j <= right) temp[k++] = arr[j++];

  for (i = left, k = 0; i <= right; ++i, ++k) {
    arr[i] = temp[k];
  }
}

// Wrapper functions
void sort_sequential(std::vector<double> &arr) {
  merge_sort_sequential(arr, 0, arr.size() - 1);
}

void sort_parallel(std::vector<double> &arr, int max_depth = 3) {
  merge_sort_parallel(arr, 0, arr.size() - 1, max_depth);
}

// ============================================================================
// Testing Functions
// ============================================================================

void test_strassen_correctness() {
  std::cout << "\n=== Testing Strassen's Algorithm Correctness ===\n";
  
  std::vector<std::pair<int, int>> test_sizes = {
    {64, 64}, {100, 100}, {128, 128}, {200, 200}
  };

  for (auto &size : test_sizes) {
    int n = size.first;
    Matrix A(n, n);
    Matrix B(n, n);
    A.randomize();
    B.randomize();

    Matrix seq_result = multiply_sequential(A, B);
    Matrix strassen_seq_result = multiply_strassen(A, B, false);
    Matrix strassen_par_result = multiply_strassen(A, B, true, 2);

    bool seq_ok = seq_result == strassen_seq_result;
    bool par_ok = seq_result == strassen_par_result;

    std::cout << "Size " << n << "x" << n << ": ";
    std::cout << (seq_ok ? "Sequential Strassen OK, " : "Sequential Strassen FAIL, ");
    std::cout << (par_ok ? "Parallel Strassen OK" : "Parallel Strassen FAIL") << "\n";

    assert(seq_ok && par_ok);
  }

  std::cout << "All Strassen tests passed!\n";
}

void benchmark_strassen() {
  std::cout << "\n=== Benchmarking Strassen's Algorithm ===\n";
  
  std::vector<int> sizes = {128, 256, 512, 1024};
  std::vector<int> depths = {1, 2, 3};

  for (int size : sizes) {
    Matrix A(size, size);
    Matrix B(size, size);
    A.randomize();
    B.randomize();

    std::cout << "\nMatrix size: " << size << "x" << size << "\n";

    // Sequential standard multiplication
    auto start = std::chrono::high_resolution_clock::now();
    Matrix seq_result = multiply_sequential(A, B);
    auto end = std::chrono::high_resolution_clock::now();
    double sequential_time = std::chrono::duration<double>(end - start).count();
    std::cout << "Sequential (standard): " << sequential_time << "s\n";

    // Sequential Strassen
    start = std::chrono::high_resolution_clock::now();
    multiply_strassen(A, B, false);
    end = std::chrono::high_resolution_clock::now();
    double strassen_seq_time = std::chrono::duration<double>(end - start).count();
    std::cout << "Sequential Strassen: " << strassen_seq_time << "s, Speedup: " 
              << sequential_time / strassen_seq_time << "\n";

    // Parallel Strassen with different depths
    for (int depth : depths) {
      start = std::chrono::high_resolution_clock::now();
      multiply_strassen(A, B, true, depth);
      end = std::chrono::high_resolution_clock::now();
      double strassen_par_time = std::chrono::duration<double>(end - start).count();
      std::cout << "Parallel Strassen (depth=" << depth << "): " << strassen_par_time 
                << "s, Speedup: " << sequential_time / strassen_par_time << "\n";
    }
  }
}

void test_sorting_correctness() {
  std::cout << "\n=== Testing Parallel Sorting Correctness ===\n";
  
  std::vector<int> test_sizes = {100, 1000, 10000, 100000};

  for (int size : test_sizes) {
    std::vector<double> arr1(size);
    std::vector<double> arr2(size);
    std::vector<double> arr3(size);

    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<> dis(0.0, 1000.0);

    for (int i = 0; i < size; ++i) {
      double val = dis(gen);
      arr1[i] = arr2[i] = arr3[i] = val;
    }

    // Sequential sort
    sort_sequential(arr1);

    // Parallel sort
    sort_parallel(arr2, 3);

    // Standard library sort for reference
    std::sort(arr3.begin(), arr3.end());

    // Verify correctness
    bool correct = (arr1 == arr2) && (arr1 == arr3);
    std::cout << "Size " << size << ": " << (correct ? "OK" : "FAIL") << "\n";
    assert(correct);
  }

  std::cout << "All sorting tests passed!\n";
}

void benchmark_sorting() {
  std::cout << "\n=== Benchmarking Parallel Sorting ===\n";
  
  std::vector<int> sizes = {10000, 100000, 1000000, 10000000};
  std::vector<int> depths = {1, 2, 3, 4};

  for (int size : sizes) {
    std::vector<double> arr_seq(size);
    std::vector<double> arr_par(size);

    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<> dis(0.0, 1000.0);

    for (int i = 0; i < size; ++i) {
      double val = dis(gen);
      arr_seq[i] = arr_par[i] = val;
    }

    std::cout << "\nArray size: " << size << "\n";

    // Sequential sort
    auto start = std::chrono::high_resolution_clock::now();
    sort_sequential(arr_seq);
    auto end = std::chrono::high_resolution_clock::now();
    double sequential_time = std::chrono::duration<double>(end - start).count();
    std::cout << "Sequential: " << sequential_time << "s\n";

    // Parallel sort with different depths
    for (int depth : depths) {
      std::copy(arr_seq.begin(), arr_seq.end(), arr_par.begin());
      start = std::chrono::high_resolution_clock::now();
      sort_parallel(arr_par, depth);
      end = std::chrono::high_resolution_clock::now();
      double parallel_time = std::chrono::duration<double>(end - start).count();
      std::cout << "Parallel (depth=" << depth << "): " << parallel_time 
                << "s, Speedup: " << sequential_time / parallel_time << "\n";
    }
  }
}

int main() {
  std::cout << "=== Lab 3: Parallel Algorithm Design Patterns ===\n";
  
  // 3.1 Strassen's Algorithm
  test_strassen_correctness();
  benchmark_strassen();
  
  // 3.2 Parallel Sorting
  test_sorting_correctness();
  benchmark_sorting();
  
  std::cout << "\n=== All tests completed ===\n";
  return 0;
}


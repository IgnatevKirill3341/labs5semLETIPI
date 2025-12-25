#include <CL/cl.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <fstream>
#include <iostream>
#include <random>
#include <string>
#include <thread>
#include <vector>

namespace {

// Простая обёртка, чтобы держать выбранную платформу/устройство и созданные
// объекты OpenCL.
struct OpenCLContext {
  cl_platform_id platform{};
  cl_device_id device{};
  cl_context context{};
  cl_command_queue queue{};
};

// Проверка кода возврата OpenCL; при ошибке завершаем программу.
void checkStatus(cl_int status, const std::string &what) {
  if (status != CL_SUCCESS) {
    std::cerr << what << " failed with status " << status << std::endl;
    std::exit(EXIT_FAILURE);
  }
}

// Читает текст ядра из файла целиком.
std::string loadKernel(const std::string &path) {
  std::ifstream file(path);
  if (!file.is_open()) {
    std::cerr << "Cannot open kernel file: " << path << std::endl;
    std::exit(EXIT_FAILURE);
  }
  return std::string(std::istreambuf_iterator<char>(file),
                     std::istreambuf_iterator<char>());
}

// Выбирает устройство (предпочтительно GPU), создаёт контекст и очередь с
// профилированием.
OpenCLContext initOpenCL() {
  OpenCLContext ctx{};

  cl_uint platformCount = 0; // сначала узнаём, сколько платформ есть
  checkStatus(clGetPlatformIDs(0, nullptr, &platformCount),
              "clGetPlatformIDs count");
  std::vector<cl_platform_id> platforms(platformCount);
  checkStatus(clGetPlatformIDs(platformCount, platforms.data(), nullptr),
              "clGetPlatformIDs list");

  // Сначала ищем GPU; если не нашли — упадём в запасной путь ниже.
  for (auto platform : platforms) {
    cl_uint deviceCount = 0;
    cl_int status =
        clGetDeviceIDs(platform, CL_DEVICE_TYPE_GPU, 0, nullptr, &deviceCount);
    if (status != CL_SUCCESS || deviceCount == 0)
      continue;
    std::vector<cl_device_id> devices(deviceCount);
    checkStatus(clGetDeviceIDs(platform, CL_DEVICE_TYPE_GPU, deviceCount,
                               devices.data(), nullptr),
                "clGetDeviceIDs");
    ctx.platform = platform;
    ctx.device = devices.front();
    break;
  }
  if (!ctx.device) {
    ctx.platform = platforms.front();
    checkStatus(clGetDeviceIDs(ctx.platform, CL_DEVICE_TYPE_ALL, 1, &ctx.device,
                               nullptr),
                "clGetDeviceIDs fallback");
    std::cout << "GPU not found; using fallback device." << std::endl;
  }

  // Создаём контекст для одного выбранного устройства.
  ctx.context =
      clCreateContext(nullptr, 1, &ctx.device, nullptr, nullptr, nullptr);
  if (!ctx.context) {
    std::cerr << "Failed to create OpenCL context" << std::endl;
    std::exit(EXIT_FAILURE);
  }

  // Создаём очередь команд с включённым профилированием (нужно для замеров
  // времени).
  ctx.queue = clCreateCommandQueue(ctx.context, ctx.device,
                                   CL_QUEUE_PROFILING_ENABLE, nullptr);
  if (!ctx.queue) {
    std::cerr << "Failed to create command queue" << std::endl;
    std::exit(EXIT_FAILURE);
  }
  return ctx;
}

cl_program buildProgram(const OpenCLContext &ctx, const std::string &source,
                        const std::string &options) {
  const char *src = source.c_str();
  const size_t length = source.size();
  cl_int status = CL_SUCCESS;
  cl_program program =
      clCreateProgramWithSource(ctx.context, 1, &src, &length, &status);
  checkStatus(status, "clCreateProgramWithSource");

  status = clBuildProgram(program, 1, &ctx.device, options.c_str(), nullptr,
                          nullptr);
  if (status != CL_SUCCESS) {
    size_t logSize = 0;
    clGetProgramBuildInfo(program, ctx.device, CL_PROGRAM_BUILD_LOG, 0, nullptr,
                          &logSize);
    std::string log(logSize, '\0');
    clGetProgramBuildInfo(program, ctx.device, CL_PROGRAM_BUILD_LOG, logSize,
                          log.data(), nullptr);
    std::cerr << "Build log:\n" << log << std::endl;
    checkStatus(status, "clBuildProgram");
  }
  return program;
}

// Генерация квадратной матрицы N x N со случайными значениями в [-1, 1].
std::vector<float> randomMatrix(int N) {
  std::vector<float> data(N * N);
  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);
  for (auto &v : data)
    v = dist(rng);
  return data;
}

// Многопоточное умножение матриц на CPU (8 потоков).
// Каждый поток обрабатывает свой диапазон строк: C += A*B.
void matmulCPU(const std::vector<float> &A, const std::vector<float> &B,
               std::vector<float> &C, int N) {
  const int numThreads = 8; // количество потоков
  std::vector<std::thread> threads;

  // Функция для одного потока: обрабатывает строки от startRow до endRow
  auto threadFunc = [&](int startRow, int endRow) {
    for (int i = startRow; i < endRow; ++i) {
      for (int k = 0; k < N; ++k) {
        const float a = A[i * N + k];
        for (int j = 0; j < N; ++j) {
          C[i * N + j] += a * B[k * N + j];
        }
      }
    }
  };

  // Разделяем работу между потоками
  const int rowsPerThread =
      (N + numThreads - 1) / numThreads; // округляем вверх

  // Запускаем потоки
  for (int t = 0; t < numThreads; ++t) {
    const int startRow = t * rowsPerThread;
    const int endRow = std::min(startRow + rowsPerThread, N);
    threads.emplace_back(threadFunc, startRow, endRow);
  }

  // Ждём завершения всех потоков
  for (auto &thread : threads) {
    thread.join();
  }
}

// Максимальное абсолютное расхождение между двумя массивами.
float maxDiff(const std::vector<float> &a, const std::vector<float> &b) {
  float m = 0.0f;
  for (size_t i = 0; i < a.size(); ++i)
    m = std::max(m, std::abs(a[i] - b[i]));
  return m;
}

struct MatmulResult {
  double cpuMs{}; // время CPU
  double gpuMs{}; // время GPU (по профилированию)
  float error{};  // максимальная погрешность
};

// Запуск GPU умножения с тильным ядром, сравнение с CPU.
// ctx   — готовый OpenCL контекст/очередь/устройство.
// N     — размер квадратных матриц (N x N).
// block — размер тайла (= локальная размерность work-group).
MatmulResult runMatmul(const OpenCLContext &ctx, int N, int block) {
  MatmulResult result{};
  // Генерируем входные матрицы и буферы для результатов.
  const auto A = randomMatrix(N);
  const auto B = randomMatrix(N);
  std::vector<float> Ccpu(N * N, 0.0f); // результат CPU
  std::vector<float> Cgpu(N * N, 0.0f); // результат GPU

  // CPU эталон + замер времени.
  const auto cpuStart = std::chrono::high_resolution_clock::now();
  matmulCPU(A, B, Ccpu, N);
  const auto cpuEnd = std::chrono::high_resolution_clock::now();
  result.cpuMs =
      std::chrono::duration<double, std::milli>(cpuEnd - cpuStart).count();

  // Читаем и собираем ядро с макросом BLOCK=block.
  const std::string src = loadKernel("kernels/matmul.cl");
  cl_program program =
      buildProgram(ctx, src, "-DBLOCK=" + std::to_string(block));
  cl_int status = CL_SUCCESS;
  cl_kernel kernel = clCreateKernel(program, "matmul_tiled", &status);
  checkStatus(status, "clCreateKernel(matmul_tiled)");

  // Выделяем буферы на устройстве и копируем входные данные.
  const size_t bytes = sizeof(float) * N * N; // общий размер матрицы в байтах
  cl_mem bufA =
      clCreateBuffer(ctx.context, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR,
                     bytes, const_cast<float *>(A.data()), &status);
  checkStatus(status, "clCreateBuffer A");
  cl_mem bufB =
      clCreateBuffer(ctx.context, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR,
                     bytes, const_cast<float *>(B.data()), &status);
  checkStatus(status, "clCreateBuffer B");
  cl_mem bufC =
      clCreateBuffer(ctx.context, CL_MEM_WRITE_ONLY, bytes, nullptr, &status);
  checkStatus(status, "clCreateBuffer C");

  // Передаём аргументы ядру: размер матрицы и буферы.
  checkStatus(clSetKernelArg(kernel, 0, sizeof(int), &N), "set N");
  checkStatus(clSetKernelArg(kernel, 1, sizeof(cl_mem), &bufA), "set A");
  checkStatus(clSetKernelArg(kernel, 2, sizeof(cl_mem), &bufB), "set B");
  checkStatus(clSetKernelArg(kernel, 3, sizeof(cl_mem), &bufC), "set C");

  // Округляем глобальный размер вверх до кратности блока, локальный размер =
  // block x block.
  const size_t global[2] = {
      static_cast<size_t>((N + block - 1) / block * block),
      static_cast<size_t>((N + block - 1) / block * block)};
  const size_t local[2] = {static_cast<size_t>(block),
                           static_cast<size_t>(block)};

  // Запускаем ядро, берём событие для профилирования.
  cl_event evt{};
  status = clEnqueueNDRangeKernel(ctx.queue, kernel, 2, nullptr, global, local,
                                  0, nullptr, &evt);
  checkStatus(status, "clEnqueueNDRangeKernel matmul");
  clWaitForEvents(1, &evt);

  // Читаем время начала/конца исполнения и считаем длительность в
  // миллисекундах.
  cl_ulong start = 0, end = 0;
  clGetEventProfilingInfo(evt, CL_PROFILING_COMMAND_START, sizeof(cl_ulong),
                          &start, nullptr);
  clGetEventProfilingInfo(evt, CL_PROFILING_COMMAND_END, sizeof(cl_ulong), &end,
                          nullptr);
  result.gpuMs = (end - start) * 1e-6;

  // Копируем результат с устройства и считаем максимальную погрешность
  // относительно CPU.
  checkStatus(clEnqueueReadBuffer(ctx.queue, bufC, CL_TRUE, 0, bytes,
                                  Cgpu.data(), 0, nullptr, nullptr),
              "read C");
  result.error = maxDiff(Ccpu, Cgpu);

  // Освобождаем GPU-ресурсы.
  clReleaseEvent(evt);
  clReleaseMemObject(bufA);
  clReleaseMemObject(bufB);
  clReleaseMemObject(bufC);
  clReleaseKernel(kernel);
  clReleaseProgram(program);
  return result;
}

// --- Sorting (CPU bitonic + GPU bitonic) ---

// Один шаг битонической сортировки на CPU (аналогично GPU ядру bitonic_step).
// Выполняет сравнение и перестановку пар элементов согласно параметрам j и k.
void bitonicStepCPU(std::vector<int> &data, uint32_t j, uint32_t k,
                    size_t length) {
  for (size_t i = 0; i < length; ++i) {
    const uint32_t ixj = static_cast<uint32_t>(i) ^ j; // парный индекс
    if (ixj > i &&
        ixj < length) { // проверяем, чтобы не обрабатывать пару дважды
      const bool ascending = ((i & k) == 0); // направление сортировки
      const int vi = data[i];
      const int vxj = data[ixj];
      // Меняем местами, если порядок нарушен
      if ((ascending && vi > vxj) || (!ascending && vi < vxj)) {
        data[i] = vxj;
        data[ixj] = vi;
      }
    }
  }
}

// Битоническая сортировка на CPU (та же логика, что и на GPU).
// Требует, чтобы длина была степенью двойки.
void bitonicSortCPU(std::vector<int> &data) {
  const size_t length = data.size();
  // Внешний цикл: k — длина битонической последовательности (2, 4, 8, ...,
  // length)
  for (uint32_t k = 2; k <= length; k <<= 1) {
    // Внутренний цикл: j — шаг сравнения внутри последовательности
    for (uint32_t j = k >> 1; j > 0; j >>= 1) {
      bitonicStepCPU(data, j, k, length);
    }
  }
}

// Проверка «степень двойки» — нужна для битонической сортировки.
bool isPowerOfTwo(size_t x) { return x && ((x & (x - 1)) == 0); }

struct SortResult {
  double cpuMs{}; // время CPU битонической сортировки
  double gpuMs{}; // время GPU битонической сортировки
  bool ok{};      // корректность: отсортировано и совпадает с CPU
};

// Запуск битонической сортировки на CPU и GPU, сравнение результатов.
SortResult runBitonicSort(const OpenCLContext &ctx, size_t length) {
  SortResult res{};
  // Битоника требует длину — степень двойки (для CPU и GPU).
  if (!isPowerOfTwo(length)) {
    std::cerr << "Bitonic sort requires power-of-two length." << std::endl;
    return res;
  }

  // Генерируем входной массив и его копию.
  std::mt19937 rng(1337);
  std::uniform_int_distribution<int> dist(0, 1'000'000);
  std::vector<int> cpu(length);
  for (auto &v : cpu)
    v = dist(rng);
  std::vector<int> gpu = cpu;

  // CPU битоническая сортировка и замер времени.
  const auto cpuStart = std::chrono::high_resolution_clock::now();
  bitonicSortCPU(cpu);
  const auto cpuEnd = std::chrono::high_resolution_clock::now();
  res.cpuMs =
      std::chrono::duration<double, std::milli>(cpuEnd - cpuStart).count();

  // Собираем ядро битонической сортировки.
  const std::string src = loadKernel("kernels/bitonic.cl");
  cl_program program = buildProgram(ctx, src, "");
  cl_int status = CL_SUCCESS;
  cl_kernel kernel = clCreateKernel(program, "bitonic_step", &status);
  checkStatus(status, "clCreateKernel(bitonic_step)");

  // Создаём буфер на устройстве и копируем входные данные.
  const size_t bytes = sizeof(int) * length;
  cl_mem buf =
      clCreateBuffer(ctx.context, CL_MEM_READ_WRITE | CL_MEM_COPY_HOST_PTR,
                     bytes, gpu.data(), &status);
  checkStatus(status, "clCreateBuffer sort");

  // Один шаг битонической сети: задаём аргументы и ставим в очередь.
  auto enqueueStep = [&](cl_uint j, cl_uint k) {
    checkStatus(clSetKernelArg(kernel, 0, sizeof(cl_mem), &buf), "set data");
    checkStatus(clSetKernelArg(kernel, 1, sizeof(cl_uint), &j), "set j");
    checkStatus(clSetKernelArg(kernel, 2, sizeof(cl_uint), &k), "set k");
    size_t global = length;
    checkStatus(clEnqueueNDRangeKernel(ctx.queue, kernel, 1, nullptr, &global,
                                       nullptr, 0, nullptr, nullptr),
                "enqueue bitonic");
  };

  // Полный цикл битоники: внешний k — длина последовательности, внутренний j —
  // шаг сравнения.
  const auto gpuStart = std::chrono::high_resolution_clock::now();
  for (cl_uint k = 2; k <= length; k <<= 1) {
    for (cl_uint j = k >> 1; j > 0; j >>= 1)
      enqueueStep(j, k);
  }
  clFinish(ctx.queue);
  const auto gpuEnd = std::chrono::high_resolution_clock::now();
  res.gpuMs =
      std::chrono::duration<double, std::milli>(gpuEnd - gpuStart).count();

  // Читаем результат с устройства и проверяем корректность.
  checkStatus(clEnqueueReadBuffer(ctx.queue, buf, CL_TRUE, 0, bytes, gpu.data(),
                                  0, nullptr, nullptr),
              "read sorted");
  res.ok = std::is_sorted(gpu.begin(), gpu.end()) && gpu == cpu;

  // Освобождаем ресурсы.
  clReleaseMemObject(buf);
  clReleaseKernel(kernel);
  clReleaseProgram(program);
  return res;
}

} // namespace

int main() {
  const int N = 512;    // размер матрицы N x N
  const int BLOCK = 16; // размер блока (локальная группа)
  const size_t SORT_N =
      1 << 20; // длина массива для битоники (должна быть степенью двойки)

  std::cout << "Initializing OpenCL..." << std::endl;
  OpenCLContext ctx = initOpenCL();

  // Тест блочного умножения матриц.
  std::cout << "Running block matrix multiplication (N=" << N
            << ", block=" << BLOCK << ")..." << std::endl;
  MatmulResult mm = runMatmul(ctx, N, BLOCK);
  std::cout << "CPU time: " << mm.cpuMs << " ms\n"
            << "GPU time: " << mm.gpuMs << " ms\n"
            << "Speedup: " << mm.cpuMs / mm.gpuMs << "x\n"
            << "Max abs diff: " << mm.error << std::endl;

  // Тест битонической сортировки.
  std::cout << "\nRunning GPU bitonic sort (N=" << SORT_N << ")..."
            << std::endl;
  SortResult sr = runBitonicSort(ctx, SORT_N);
  std::cout << "CPU time: " << sr.cpuMs << " ms\n"
            << "GPU time: " << sr.gpuMs << " ms\n"
            << "Speedup: " << (sr.gpuMs > 0.0 ? sr.cpuMs / sr.gpuMs : 0.0)
            << "x\n"
            << "Correct: " << (sr.ok ? "yes" : "no") << std::endl;

  // Освобождаем очередь и контекст.
  if (ctx.queue)
    clReleaseCommandQueue(ctx.queue);
  if (ctx.context)
    clReleaseContext(ctx.context);
  return 0;
}

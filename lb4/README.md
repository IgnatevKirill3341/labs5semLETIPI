# GPU Labs (OpenCL) — код с построчными пояснениями

Формат: каждая строка кода — краткое назначение. После блока строк — итог по функции целиком.

## `src/main.cpp`

### Заголовки и пространство имён
`#include <CL/cl.h>` — подключаем API OpenCL.  
`#include <algorithm> ... <vector>` — стандартные утилиты: алгоритмы, время, математика, файлы, ввод/вывод, случайные числа, строки, векторы.  
`namespace { ... }` — всё содержимое файла остаётся внутренним, не экспортируется.

### Инициализация и утилиты
`struct OpenCLContext { cl_platform_id platform; ... cl_command_queue queue; };` — храним выбранную платформу, устройство, контекст и очередь.  
`void checkStatus(cl_int status, const std::string& what)` — проверка кода OpenCL, при ошибке печать и выход.  
`std::string loadKernel(const std::string& path)` — читает текст ядра из файла, при неудаче завершает программу.  
`OpenCLContext initOpenCL()` — выбирает GPU (или первый доступный девайс), создаёт контекст и очередь с профилированием.  
`cl_program buildProgram(..., const std::string& source, const std::string& options)` — создаёт программу из строки, компилирует, при ошибке выводит лог.

Итог по блоку: создаём базовые инструменты для работы с OpenCL — выбор устройства, контекст, очередь, загрузка и сборка программ, проверка ошибок.

### Генерация и CPU-помощники
`std::vector<float> randomMatrix(int N)` — матрица N×N со случайными значениями [-1, 1].  
`void matmulCPU(const std::vector<float>& A, const std::vector<float>& B, std::vector<float>& C, int N)` — наивное тройное умножение матриц на CPU (последовательно).  
`float maxDiff(const std::vector<float>& a, const std::vector<float>& b)` — максимальное абсолютное отклонение двух массивов.

Итог по блоку: получаем входные данные и CPU-референс для последующего сравнения с GPU.

### Результаты умножения
`struct MatmulResult { double cpuMs; double gpuMs; float error; };` — времена CPU/GPU и погрешность.

Итог: удобная упаковка метрик умножения.

### `MatmulResult runMatmul(const OpenCLContext& ctx, int N, int block)`
`MatmulResult result{};` — заготовка для метрик.  
`const auto A = randomMatrix(N);` — генерируем матрицу A.  
`const auto B = randomMatrix(N);` — генерируем матрицу B.  
`std::vector<float> Ccpu(N * N, 0.0f);` — буфер результата CPU.  
`std::vector<float> Cgpu(N * N, 0.0f);` — буфер результата GPU.  
`cpuStart = now(); matmulCPU(...); cpuEnd = now();` — считаем и замеряем CPU.  
`const std::string src = loadKernel("kernels/matmul.cl");` — читаем текст ядра.  
`cl_program program = buildProgram(ctx, src, "-DBLOCK=" + std::to_string(block));` — компилируем с макросом BLOCK.  
`cl_kernel kernel = clCreateKernel(program, "matmul_tiled", ...);` — создаём kernel.  
`cl_mem bufA/B/C = clCreateBuffer(..., CL_MEM_COPY_HOST_PTR, ...);` — размещаем матрицы на устройстве, C — выход.  
`clSetKernelArg(... N/A/B/C ...)` — передаём аргументы ядру.  
`const size_t global[2] = {...}; const size_t local[2] = {...};` — глобальная сетка округлена до блока, локальная = block×block.  
`clEnqueueNDRangeKernel(..., &evt);` — ставим ядро в очередь, получаем событие.  
`clGetEventProfilingInfo(... start/end ...)` — читаем время старта/конца, считаем gpuMs.  
`clEnqueueReadBuffer(..., Cgpu.data(), ...)` — копируем результат с устройства.  
`result.error = maxDiff(Ccpu, Cgpu);` — сравниваем с CPU.  
`clRelease...` — освобождаем событие, буферы, ядро, программу.  
`return result;` — отдаём метрики.

Итог по функции: выполняет блочное умножение на GPU, меряет время CPU/GPU, сверяет результаты и освобождает ресурсы.

### Merge sort (CPU) и утилиты
`void merge(...)` — слияние двух отсортированных половин в один буфер.  
`void mergeSortRec(...)` — рекурсивно делит массив и сливает обратно.  
`void mergeSortCPU(std::vector<int>& data)` — точка входа CPU merge sort с временным буфером.  
`bool isPowerOfTwo(size_t x)` — проверка степени двойки (требование битоники).

Итог: CPU-референс для сортировки и проверка длины.

### Результаты сортировки
`struct SortResult { double cpuMs; double gpuMs; bool ok; };` — времена CPU/GPU и флаг корректности.

Итог: упаковка метрик сортировки.

### `SortResult runBitonicSort(const OpenCLContext& ctx, size_t length)`
`std::vector<int> cpu/gpu = ...` — генерируем случайный массив и копию.  
`mergeSortCPU(cpu);` — сортируем CPU для эталона и замера.  
`if (!isPowerOfTwo(length)) { ... return res; }` — защита: длина должна быть степенью двойки.  
`src = loadKernel("kernels/bitonic.cl"); program = buildProgram(...); kernel = clCreateKernel(...);` — сборка ядра битоники.  
`cl_mem buf = clCreateBuffer(..., gpu.data(), ...);` — создаём буфер с копией данных.  
`enqueueStep = [&] { clSetKernelArg(... data/j/k ...); clEnqueueNDRangeKernel(...); };` — лямбда запуска одного шага.  
`for k ... for j ... enqueueStep(j, k);` — двойной цикл шагов битонической сети.  
`clFinish(ctx.queue);` — ждём окончания всех шагов.  
`gpuMs = duration(gpuStart, gpuEnd);` — измеряем время GPU.  
`clEnqueueReadBuffer(..., gpu.data(), ...)` — копируем отсортированный массив.  
`res.ok = std::is_sorted(gpu.begin(), gpu.end()) && gpu == cpu;` — проверяем правильность.  
`clRelease...` — освобождаем буфер, ядро, программу.  
`return res;`

Итог по функции: выполняет битоническую сортировку на GPU, сравнивает с CPU merge sort и возвращает времена и корректность.

### `int main()`
`const int N = 512; const int BLOCK = 16; const size_t SORT_N = 1 << 20;` — параметры тестов.  
`OpenCLContext ctx = initOpenCL();` — инициализация OpenCL.  
`MatmulResult mm = runMatmul(ctx, N, BLOCK);` — запуск матричного умножения.  
`std::cout << ... mm ...` — вывод времен, ускорения, погрешности.  
`SortResult sr = runBitonicSort(ctx, SORT_N);` — запуск битонической сортировки.  
`std::cout << ... sr ...` — вывод времен, ускорения, корректности.  
`clReleaseCommandQueue/Context` — освобождение ресурсов.  
`return 0;` — успешное завершение.

Итог по функции: запускает оба теста (умножение и сортировку), печатает метрики и корректность, очищает OpenCL-ресурсы.

---

## `kernels/matmul.cl` (ядро тильного умножения)
`__kernel void matmul_tiled(const int N, __global const float* A, __global const float* B, __global float* C)` — сигнатура ядра: размер N и указатели на матрицы.  
`row = get_global_id(1); col = get_global_id(0);` — глобальные индексы элемента C.  
`localRow = get_local_id(1); localCol = get_local_id(0);` — позиция внутри тайла.  
`__local float Asub[BLOCK][BLOCK], Bsub[BLOCK][BLOCK];` — локальные подблоки для переиспользования.  
Цикл по t:  
`tiledCol/Row = t + localCol/Row;` — смещение по текущей плитке.  
`Asub[...] = (row < N && tiledCol < N) ? A[...] : 0;` — загрузка блока A с проверкой границ.  
`Bsub[...] = (tiledRow < N && col < N) ? B[...] : 0;` — загрузка блока B.  
`barrier(CLK_LOCAL_MEM_FENCE);` — синхронизация перед умножением.  
`acc += Asub[localRow][k] * Bsub[k][localCol];` — умножаем локальные подблоки.  
`barrier(...)` — перед переходом к следующей плитке.  
`if (row < N && col < N) C[row * N + col] = acc;` — записываем результат.

Итог по ядру: каждая рабочая группа обрабатывает тайл `BLOCK×BLOCK`, переиспользуя данные в локальной памяти, чтобы уменьшить обращения к глобальной памяти.

## `kernels/bitonic.cl` (ядро шага битонической сортировки)
`__kernel void bitonic_step(__global int* data, const uint j, const uint k)` — сигнатура: буфер данных и параметры текущего шага.  
`i = get_global_id(0); ixj = i ^ j;` — текущий индекс и его парный по битонике.  
`if (ixj > i) { ... }` — работаем только с одной стороны пары, чтобы не дублировать обмен.  
`ascending = ((i & k) == 0);` — направление сортировки (возрастание/убывание) для этой пары.  
`if ((ascending && vi > vxj) || (!ascending && vi < vxj)) swap;` — при нарушении порядка меняем элементы.

Итог по ядру: один вызов делает один шаг сети сравнения–перестановки для всех элементов; последовательные шаги (k, j) строят полную битоническую сортировку.

---

## Сборка и запуск
Требуются: `cmake` (>=3.16), компилятор с C++17, OpenCL заголовки/библиотеки.

```bash
cd /home/kpspdk/PA4LAB
cmake -S . -B build
cmake --build build -j
./build/pa4lab
```
По умолчанию:
- умножение матриц `N=512`, тайл `16x16`;
- сортировка `N=2^20` (битоника требует степень двойки).

### Пример вывода и как читать
```
Initializing OpenCL...
Running block matrix multiplication (N=512, block=16)...
CPU time: 886.939 ms
GPU time: 4.25656 ms
Speedup: 208.37x
Max abs diff: 1.14441e-05

Running GPU bitonic sort (N=1048576)...
CPU time: 455.427 ms
GPU time: 15.1268 ms
Speedup: 30.1072x
Correct: yes
```
- `CPU time` / `GPU time` — времена в миллисекундах на CPU/GPU.
- `Speedup` — ускорение (CPU / GPU).
- `Max abs diff` — погрешность между результатами CPU и GPU для умножения.
- `Correct: yes` — итог сортировки совпал с CPU и отсортирован.
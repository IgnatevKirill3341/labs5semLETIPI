// Блочное умножение матриц: C = A x B
__kernel void matmul_tiled(const int N,
                           __global const float* A,
                           __global const float* B,
                           __global float* C) {
    const int row = get_global_id(1);     // глобальный индекс строки C
    const int col = get_global_id(0);     // глобальный индекс столбца C
    const int localRow = get_local_id(1); // позиция внутри work-group (строка)
    const int localCol = get_local_id(0); // позиция внутри work-group (столбец)

    // Локальные блоки A и B (shared memory внутри work-group).
    __local float Asub[BLOCK][BLOCK];
    __local float Bsub[BLOCK][BLOCK];

    float acc = 0.0f;
    // Проходим по всем блокам по оси K (общая размерность K).
    for (int t = 0; t < N; t += BLOCK) {
        const int tiledCol = t + localCol; // смещение столбца для A
        const int tiledRow = t + localRow; // смещение строки для B

        // Кооперативная загрузка блоков из глобальной памяти в локальную.
        Asub[localRow][localCol] = (row < N && tiledCol < N) ? A[row * N + tiledCol] : 0.0f;
        Bsub[localRow][localCol] = (tiledRow < N && col < N) ? B[tiledRow * N + col] : 0.0f;

        barrier(CLK_LOCAL_MEM_FENCE); // ждём, пока все загрузят тайл

        // Умножаем два локальных блока и накапливаем в acc.
        for (int k = 0; k < BLOCK; ++k) {
            acc += Asub[localRow][k] * Bsub[k][localCol];
        }

        barrier(CLK_LOCAL_MEM_FENCE); // очищаем перед следующим блоком
    }

    if (row < N && col < N) {
        C[row * N + col] = acc;
    }
}


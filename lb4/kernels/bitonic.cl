// Битоническая сортировка «на месте», один work-item на элемент.
__kernel void bitonic_step(__global int* data,
                           const uint j,
                           const uint k) {
    const uint i = get_global_id(0); // текущий индекс элемента
    const uint ixj = i ^ j;          // парный индекс по правилу XOR

    if (ixj > i) {
        const bool ascending = ((i & k) == 0); // направление: возр./убыв.
        const int vi = data[i];
        const int vxj = data[ixj];
        // Меняем местами, если порядок нарушен.
        if ((ascending && vi > vxj) || (!ascending && vi < vxj)) { // нapyшено возрастание || нарушено убывание
            data[i] = vxj;
            data[ixj] = vi;
        }
    }
}


#include <iostream>
#include <vector>
#include <thread>
#include <random>
#include <chrono>
#include <fstream>
#include <cassert>

#include "coarse_list.hpp"
#include "fine_list.hpp"
#include "lockfree_list.hpp"

template<typename List>
void correctness_test() {
    List list;
    assert(list.insert(5));
    assert(list.insert(3));
    assert(list.insert(7));
    assert(!list.insert(5));
    assert(list.find(3));
    assert(list.find(7));
    assert(!list.find(4));
    assert(list.delete_(3));
    assert(!list.find(3));
    assert(list.delete_(5));
    assert(list.delete_(7));
    assert(!list.delete_(7));
    std::cout << "✅ Correctness test passed for " << typeid(List).name() << "\n";
}

template<typename List>
double benchmark(int num_threads, int read_ratio, int duration_sec = 3) {
    List list;
    const int key_range = 10000;
    std::atomic<bool> start{false}, stop{false};
    std::atomic<size_t> ops{0};

    // Предзаполнение
    for (int i = 0; i < key_range / 2; ++i) {
        list.insert(i);
    }

    std::vector<std::thread> threads;
    std::random_device rd;
    std::mt19937 gen(rd());

    for (int t = 0; t < num_threads; ++t) {
        threads.emplace_back([&list, &start, &stop, &ops, read_ratio, key_range, gen = gen]() mutable {
            std::uniform_int_distribution<> dis(0, 99);
            std::uniform_int_distribution<> key_dis(0, key_range - 1);
            while (!start.load()) std::this_thread::yield();
            while (!stop.load()) {
                int op = dis(gen);
                int key = key_dis(gen);
                if (op < read_ratio) {
                    list.find(key);
                } else {
                    if (dis(gen) < 50) {
                        list.insert(key);
                    } else {
                        list.delete_(key);
                    }
                }
                ops++;
            }
        });
    }

    start.store(true);
    std::this_thread::sleep_for(std::chrono::seconds(duration_sec));
    stop.store(true);

    for (auto& t : threads) t.join();

    double time_sec = static_cast<double>(duration_sec);
    return static_cast<double>(ops.load()) / time_sec;
}

void run_performance_tests() {
    std::ofstream file("results.csv");
    file << "impl,threads,read_ratio,throughput\n";

    std::vector<std::string> names = {"Coarse", "Fine", "LockFree"};
    std::vector<int> thread_counts = {1, 2, 4, 8, 16, 32};
    std::vector<int> read_ratios = {100, 90, 50, 10, 0};

    for (int th : thread_counts) {
        for (int rr : read_ratios) {
            std::cout << "Testing threads=" << th << ", read%=" << rr << "\n";

            double t1 = benchmark<CoarseGrainedList>(th, rr);
            double t2 = benchmark<FineGrainedList>(th, rr);
            double t3 = benchmark<LockFreeList>(th, rr);

            file << "Coarse," << th << "," << rr << "," << t1 << "\n";
            file << "Fine," << th << "," << rr << "," << t2 << "\n";
            file << "LockFree," << th << "," << rr << "," << t3 << "\n";
        }
    }
    file.close();
    std::cout << "📊 Results saved to results.csv\n";
}

int main() {
    correctness_test<CoarseGrainedList>();
    correctness_test<FineGrainedList>();
    correctness_test<LockFreeList>();

    run_performance_tests();
    return 0;
}
#pragma once
#include <atomic>
#include <climits>

class LockFreeList {
    struct Node {
        int key;
        std::atomic<bool> marked{false};
        std::atomic<Node*> next{nullptr};
        Node(int k) : key(k) {}
        // ❌ НЕ удаляем next — избегаем use-after-free и рекурсии
    };

    // Сентинел-узел для упрощения логики (ключ = INT_MAX)
    Node* const head_sentinel = new Node(INT_MAX);

public:
    LockFreeList() {
        head_sentinel->next.store(nullptr);
    }

    // ❌ Намеренно не удаляем узлы — утечка памяти, но безопасно для lock-free
    ~LockFreeList() {
        // В учебных целях: не пытаемся корректно освободить память
        // delete head_sentinel; // даже это опасно без синхронизации
    }

    bool insert(int key) {
        if (key == INT_MAX) return false; // защищаем sentinela
        while (true) {
            Node* pred = head_sentinel;
            Node* curr = pred->next.load();

            // Поиск позиции + помощь в физическом удалении помеченных узлов
            while (true) {
                if (!curr) break;
                Node* succ = curr->next.load();
                bool marked = curr->marked.load();
                if (marked) {
                    // Помогаем удалить помеченный узел
                    if (pred->next.compare_exchange_strong(curr, succ)) {
                        // Узел отвязан, но НЕ удаляем его!
                    }
                    curr = pred->next.load();
                } else {
                    if (curr->key >= key) break;
                    pred = curr;
                    curr = succ;
                }
            }

            if (curr && curr->key == key) {
                return false; // уже существует
            }

            Node* new_node = new Node(key);
            new_node->next.store(curr);
            if (pred->next.compare_exchange_strong(curr, new_node)) {
                return true;
            }
            // Не удаляем new_node — может быть использован другим потоком!
            // В реальности: отложить удаление. Здесь — утечка.
        }
    }

    bool delete_(int key) {
        if (key == INT_MAX) return false;
        while (true) {
            Node* pred = head_sentinel;
            Node* curr = pred->next.load();

            while (curr) {
                Node* succ = curr->next.load();
                bool marked = curr->marked.load();
                if (marked) {
                    pred->next.compare_exchange_strong(curr, succ);
                    curr = pred->next.load();
                } else {
                    if (curr->key >= key) break;
                    pred = curr;
                    curr = succ;
                }
            }

            if (!curr || curr->key != key) {
                return false;
            }

            if (curr->marked.exchange(true)) {
                return false; // уже удалён
            }

            // Пытаемся физически отвязать
            Node* succ = curr->next.load();
            pred->next.compare_exchange_strong(curr, succ);
            // НЕ вызываем delete curr!
            return true;
        }
    }

    bool find(int key) const {
        if (key == INT_MAX) return false;
        Node* curr = head_sentinel->next.load();
        while (curr) {
            if (!curr->marked.load()) {
                if (curr->key == key) return true;
                if (curr->key > key) break;
            }
            curr = curr->next.load();
        }
        return false;
    }
};
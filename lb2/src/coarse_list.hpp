#pragma once
#include <mutex>
#include <memory>

class CoarseGrainedList {
    struct Node {
        int key;
        std::unique_ptr<Node> next;
        Node(int k) : key(k) {}
    };

    mutable std::mutex mtx;
    std::unique_ptr<Node> head;

public:
    CoarseGrainedList() : head(nullptr) {}

    bool insert(int key) {
        std::lock_guard<std::mutex> lock(mtx);
        if (!head || head->key > key) {
            auto new_node = std::make_unique<Node>(key);
            new_node->next = std::move(head);
            head = std::move(new_node);
            return true;
        }
        Node* curr = head.get();
        while (curr->next && curr->next->key < key)
            curr = curr->next.get();
        if (curr->next && curr->next->key == key)
            return false;
        auto new_node = std::make_unique<Node>(key);
        new_node->next = std::move(curr->next);
        curr->next = std::move(new_node);
        return true;
    }

    bool delete_(int key) {
        std::lock_guard<std::mutex> lock(mtx);
        if (!head) return false;
        if (head->key == key) {
            head = std::move(head->next);
            return true;
        }
        Node* curr = head.get();
        while (curr->next && curr->next->key < key)
            curr = curr->next.get();
        if (curr->next && curr->next->key == key) {
            curr->next = std::move(curr->next->next);
            return true;
        }
        return false;
    }

    bool find(int key) const {
        std::lock_guard<std::mutex> lock(mtx);
        Node* curr = head.get();
        while (curr && curr->key < key)
            curr = curr->next.get();
        return curr && curr->key == key;
    }
};
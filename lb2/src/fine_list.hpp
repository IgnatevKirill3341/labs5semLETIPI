#pragma once
#include <mutex>
#include <memory>

class FineGrainedList {
    struct Node {
        int key;
        std::unique_ptr<Node> next;
        mutable std::mutex mtx;
        Node(int k) : key(k) {}
    };

    std::unique_ptr<Node> head;

public:
    FineGrainedList() : head(std::make_unique<Node>(INT32_MAX)) {} // sentinel

    bool insert(int key) {
        Node* pred = head.get();
        pred->mtx.lock();
        Node* curr = pred->next.get();
        if (curr) curr->mtx.lock();

        while (curr && curr->key < key) {
            pred->mtx.unlock();
            pred = curr;
            curr = curr->next.get();
            if (curr) curr->mtx.lock();
        }

        bool inserted = false;
        if (!curr || curr->key != key) {
            auto new_node = std::make_unique<Node>(key);
            new_node->next = std::move(pred->next);
            pred->next = std::move(new_node);
            inserted = true;
        }

        if (curr) curr->mtx.unlock();
        pred->mtx.unlock();
        return inserted;
    }

    bool delete_(int key) {
        Node* pred = head.get();
        pred->mtx.lock();
        Node* curr = pred->next.get();
        if (curr) curr->mtx.lock();

        while (curr && curr->key < key) {
            pred->mtx.unlock();
            pred = curr;
            curr = curr->next.get();
            if (curr) curr->mtx.lock();
        }

        bool deleted = false;
        if (curr && curr->key == key) {
            pred->next = std::move(curr->next);
            deleted = true;
        }

        if (curr) curr->mtx.unlock();
        pred->mtx.unlock();
        return deleted;
    }

    bool find(int key) const {
        Node* pred = const_cast<Node*>(head.get());
        pred->mtx.lock();
        Node* curr = pred->next.get();
        if (curr) curr->mtx.lock();

        while (curr && curr->key < key) {
            pred->mtx.unlock();
            pred = curr;
            curr = curr->next.get();
            if (curr) curr->mtx.lock();
        }

        bool found = curr && curr->key == key;

        if (curr) curr->mtx.unlock();
        pred->mtx.unlock();
        return found;
    }
};
<template>
  <v-app>
    <v-app-bar app color="primary" density="comfortable" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>Биржа</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/trade" variant="text" :disabled="!selectedBroker" class="text-none">
        Торги
      </v-btn>
      <v-btn to="/admin" variant="text" class="text-none">
        Админка
      </v-btn>
      <v-btn to="/login" variant="text" class="text-none">
        Войти
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app temporary>
      <v-list density="comfortable">
        <v-list-item :to="{ path: '/login' }" title="Вход"></v-list-item>
        <v-list-item :to="{ path: '/trade' }" title="Терминал" :disabled="!selectedBroker"></v-list-item>
        <v-list-item :to="{ path: '/admin' }" title="Администрирование"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container class="py-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTradingStore } from './stores/trading';

const drawer = ref(false);
const tradingStore = useTradingStore();
const selectedBroker = computed(() => tradingStore.selectedBrokerId);
</script>


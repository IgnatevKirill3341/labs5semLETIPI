<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Панель администрирования</v-card-title>
        <v-card-text>
          <p>Эти ссылки ведут на уже созданные страницы управления:</p>
          <v-list density="comfortable">
            <v-list-item href="http://localhost:3000/brokers" target="_blank" title="Управление брокерами" />
            <v-list-item href="http://localhost:3000/stocks" target="_blank" title="Включение/отключение акций" />
            <v-list-item href="http://localhost:3000/exchange" target="_blank" title="Управление торгами" />
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Текущее состояние</v-card-title>
        <v-card-text>
          <p>Текущая дата торгов: <strong>{{ tradingStore.currentDate || 'н/д' }}</strong></p>
          <p v-if="tradingStore.portfolio">Последние цены обновлены в портфеле.</p>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useTradingStore } from '../stores/trading';

const tradingStore = useTradingStore();

onMounted(() => {
  tradingStore.connectSocket();
});
</script>


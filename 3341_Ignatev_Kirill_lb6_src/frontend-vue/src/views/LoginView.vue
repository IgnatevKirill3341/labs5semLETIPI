<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Вход в терминал</v-card-title>
        <v-card-text>
          <p class="mb-4">Выберите брокера, чтобы продолжить работу с терминалом.</p>
          <v-select
            label="Брокер"
            :items="brokers"
            item-title="name"
            item-value="id"
            v-model="selected"
            density="comfortable"
            data-testid="broker-select"
          />
          <v-alert type="warning" variant="tonal" v-if="!brokers.length" class="mt-2">
            Сначала создайте брокеров в панели администрирования.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" :disabled="!selected" @click="login">Продолжить</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Администрирование</v-card-title>
        <v-card-text>
          <p>Создавайте брокеров, включайте акции и запускайте торги в административной части.</p>
          <v-btn to="/admin" color="secondary" class="text-none" variant="outlined">
            Открыть админку Vue
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useTradingStore } from '../stores/trading';

const tradingStore = useTradingStore();
const router = useRouter();
const selected = ref(tradingStore.selectedBrokerId || '');
const { brokers } = storeToRefs(tradingStore);

onMounted(async () => {
  if (!tradingStore.brokers.length) {
    await tradingStore.fetchBrokers();
  }
});

const login = async () => {
  tradingStore.setBroker(selected.value);
  await tradingStore.refreshPortfolio();
  tradingStore.connectSocket();
  router.push('/trade');
};
</script>


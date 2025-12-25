import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './views/LoginView.vue';
import TraderView from './views/TraderView.vue';
import AdminView from './views/AdminView.vue';
import { useTradingStore } from './stores/trading';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    { path: '/trade', component: TraderView, meta: { requiresBroker: true } },
    { path: '/admin', component: AdminView },
  ],
});

router.beforeEach((to, _from, next) => {
  const tradingStore = useTradingStore();
  const storedBroker = localStorage.getItem('brokerId');
  if (!tradingStore.selectedBrokerId && storedBroker) {
    tradingStore.setBroker(storedBroker);
  }

  if (to.meta.requiresBroker && !tradingStore.selectedBrokerId) {
    next('/login');
  } else {
    next();
  }
});

export default router;


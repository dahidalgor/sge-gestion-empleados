import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { publica: true } },
    {
      path: '/',
      component: () => import('@/views/LayoutView.vue'),
      children: [
        { path: '', name: 'panel', component: () => import('@/views/PanelView.vue') },
        { path: 'empleados', name: 'empleados', component: () => import('@/views/EmpleadosView.vue') },
        { path: 'sesion', name: 'sesion', component: () => import('@/views/SesionView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

/** Guardia de navegación: sin un JWT vigente solo se puede ver el login */
router.beforeEach((to) => {
  const auth = useAuthStore()
  const valida = auth.sesionValida()

  if (!to.meta.publica && !valida) {
    auth.logout()
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if (to.name === 'login' && valida) return { name: 'panel' }
})

export default router

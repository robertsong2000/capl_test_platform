import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/editor',
    name: 'Editor',
    component: () => import('../views/Editor.vue')
  },
  {
    path: '/execution',
    name: 'Execution',
    component: () => import('../views/Execution.vue')
  },
  {
    path: '/results',
    name: 'Results',
    component: () => import('../views/Results.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
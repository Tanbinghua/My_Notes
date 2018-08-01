import Vue from 'vue'
import Router from 'vue-router'
const _import = require('./_import_' + process.env.NODE_ENV)

Vue.use(Router)

// const scrollBehavior = (to, from, savedPosition) => {
//   if (savedPosition) {
//     return savedPosition
//   } else {
//     const position = {}
//     if (to.hash) {
//       position.selector = to.hash
//     }
//     if (to.matched.some(m => m.meta.scrollToTop)) {
//       position.x = 0
//       position.y = 0
//     }
//     return position
//   }
// }

export default new Router({
  routes: [
    {
      path: '/',
      component: _import('Home'),
      children: [
        { path: '/', name: 'Notes', component: _import('Notes') },
        { path: '/detail/:title', name: 'NoteDetail', component: _import('Notes') },
        { path: '/highlight', name: 'HighLight', component: _import('Highlight') },
        { path: '/trash', name: 'Trash', component: _import('Trash') }
      ]
    },
    { path: '/sign', name: 'Sign', component: _import('Sign') },
    { path: '/account', name: 'Account', component: _import('Account') },
    { path: '/terms', name: 'Terms', component: _import('Terms') },
    { path: '/privacy', name: 'Privacy', component: _import('Privacy') },
    { path: '/index', name: 'Index', component: _import('Index') },
    { path: '*', redirect: '/error' },
    { path: '/error', name: 'Error', component: _import('Error') }
  ]
  // mode: 'history',
  // scrollBehavior
})

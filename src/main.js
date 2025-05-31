import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueChartkick from 'vue-chartkick'
import Chart from 'chart.js/auto' // Using chart.js/auto for easier setup with Chart.js v3+
import 'chartjs-adapter-date-fns'; // Import the date adapter

Vue.use(VueChartkick, { adapter: Chart })

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')

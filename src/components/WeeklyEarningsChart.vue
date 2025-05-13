<template>
  <div class="chart-container">
    <Line v-if="loaded" :data="chartData" :options="chartOptions" />
    <div v-else class="loading-placeholder">Loading chart...</div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
)

export default {
  name: 'WeeklyEarningsChart',
  components: { Line },
  props: {
    chartDataProp: { // Renamed to avoid conflict with internal chartData
      type: Object,
      required: true,
      default: () => ({ labels: [], datasets: [] })
    }
  },
  data() {
    return {
      loaded: false,
      chartData: { // Internal chartData to be used by the chart component
        labels: [],
        datasets: []
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '€' + value;
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Week Starting'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    }
  },
  watch: {
    chartDataProp: {
      handler(newData) {
        if (newData && newData.labels && newData.labels.length > 0 && newData.datasets && newData.datasets.length > 0) {
          this.chartData = {
            labels: newData.labels,
            datasets: newData.datasets.map(dataset => ({
              ...dataset,
              borderColor: '#4CAF50', // Example: Green line
              backgroundColor: 'rgba(76, 175, 80, 0.1)', // Example: Light green fill
              tension: 0.1
            }))
          };
          this.loaded = true;
        } else {
          this.loaded = false;
          // Optionally, provide default empty state for chartData if needed
          this.chartData = { labels: [], datasets: [] };
        }
      },
      immediate: true, // Process the initial prop value
      deep: true
    }
  },
  mounted() {
    // Initial data processing is handled by the watcher with immediate: true
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  /* Optimized for display within ManageLocationPage - adjust as needed */
  height: 250px; /* Or a min-height */
  width: 100%; /* Take full width of its container */
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #757575;
}
</style>

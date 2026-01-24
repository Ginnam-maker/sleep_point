<template>
	<view class="charts-box">
		<canvas 
			:canvas-id="canvasId" 
			:id="canvasId" 
			class="charts" 
			:style="{width: cWidth * pixelRatio + 'px', height: cHeight * pixelRatio + 'px'}"
			@touchstart="touchStart"
			@touchmove="touchMove"
			@touchend="touchEnd"
		/>
	</view>
</template>

<script>
import uCharts from '@qiun/ucharts';

let uChartsInstance = null;

export default {
	name: 'qiun-ucharts',
	props: {
		type: {
			type: String,
			default: 'column'
		},
		opts: {
			type: Object,
			default() {
				return {};
			}
		},
		chartData: {
			type: Object,
			default() {
				return {};
			}
		},
		canvasId: {
			type: String,
			default: 'uCharts'
		},
		cWidth: {
			type: Number,
			default: 375
		},
		cHeight: {
			type: Number,
			default: 250
		}
	},
	data() {
		return {
			pixelRatio: 1
		};
	},
	mounted() {
		this.init();
	},
	methods: {
		init() {
			this.pixelRatio = uni.getSystemInfoSync().pixelRatio;
			
			// 延迟初始化，确保canvas已渲染
			this.$nextTick(() => {
				setTimeout(() => {
					this.drawCharts();
				}, 100);
			});
		},
		
		drawCharts() {
			const ctx = uni.createCanvasContext(this.canvasId, this);
			
			if (!this.chartData || !this.chartData.series) {
				return;
			}
			
			const config = {
				type: this.type,
				context: ctx,
				width: this.cWidth * this.pixelRatio,
				height: this.cHeight * this.pixelRatio,
				categories: this.chartData.categories || [],
				series: this.chartData.series || [],
				animation: true,
				pixelRatio: this.pixelRatio,
				...this.opts
			};
			
			uChartsInstance = new uCharts(config);
		},
		
		updateCharts() {
			if (uChartsInstance) {
				uChartsInstance.updateData({
					categories: this.chartData.categories || [],
					series: this.chartData.series || []
				});
			}
		},
		
		touchStart(e) {
			if (uChartsInstance) {
				uChartsInstance.touchStart(e);
			}
		},
		
		touchMove(e) {
			if (uChartsInstance) {
				uChartsInstance.touchMove(e);
			}
		},
		
		touchEnd(e) {
			if (uChartsInstance) {
				uChartsInstance.touchEnd(e);
			}
		}
	},
	watch: {
		chartData: {
			handler() {
				this.$nextTick(() => {
					setTimeout(() => {
						if (uChartsInstance) {
							this.updateCharts();
						} else {
							this.drawCharts();
						}
					}, 100);
				});
			},
			deep: true
		}
	},
	beforeUnmount() {
		if (uChartsInstance) {
			uChartsInstance = null;
		}
	}
};
</script>

<style scoped>
.charts-box {
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

.charts {
	width: 100%;
	height: 100%;
}
</style>

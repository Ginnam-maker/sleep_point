<template>
	<view class="share-container">
		<!-- 海报画布 -->
		<canvas 
			canvas-id="posterCanvas" 
			id="posterCanvas"
			:style="{width: canvasWidth + 'px', height: canvasHeight + 'px'}"
			class="poster-canvas"
		/>
		
		<!-- 海报预览 -->
		<view v-if="posterImage" class="poster-preview">
			<image 
				:src="posterImage" 
				mode="widthFix"
				class="poster-image"
				@longpress="savePoster"
			/>
		</view>
		
		<!-- 操作按钮 -->
		<view class="action-section">
			<view class="action-btn" @click="generatePoster">
				<text class="btn-icon">🎨</text>
				<text class="btn-text">生成海报</text>
			</view>
			
			<view v-if="posterImage" class="action-btn secondary" @click="savePoster">
				<text class="btn-icon">💾</text>
				<text class="btn-text">保存到相册</text>
			</view>
			
			<view class="action-btn tertiary" @click="goBack">
				<text class="btn-text">返回</text>
			</view>
		</view>
		
		<!-- 提示文字 -->
		<view v-if="posterImage" class="tip-text">
			<text>长按图片也可保存到相册</text>
		</view>
	</view>
</template>

<script>
import { getAllCheckins } from '@/utils/storage.js';
import { calculateStreak } from '@/utils/index.js';

export default {
	data() {
		return {
			canvasWidth: 375,
			canvasHeight: 667,
			posterImage: '',
			streakDays: 0,
			totalDays: 0,
			achievementCount: 0
		};
	},
	
	onLoad(options) {
		// 获取屏幕宽度
		const systemInfo = uni.getSystemInfoSync();
		this.canvasWidth = systemInfo.windowWidth - 64;
		this.canvasHeight = this.canvasWidth * 1.78; // 16:9 比例
		
		// 加载统计数据
		this.loadStats();
		
		// 如果从其他页面传来了type参数，自动生成
		if (options.type === 'achievement') {
			this.achievementCount = options.count || 0;
			setTimeout(() => {
				this.generatePoster();
			}, 500);
		}
	},
	
	methods: {
		// 加载统计数据
		loadStats() {
			const checkins = getAllCheckins();
			this.totalDays = checkins.length;
			this.streakDays = this.calculateStreakDays(checkins);
			
			// 获取成就数量
			const achievements = uni.getStorageSync('achievements') || [];
			this.achievementCount = achievements.length;
		},
		
		// 计算连续打卡天数
		calculateStreakDays(checkins) {
			if (checkins.length === 0) return 0;
			
			let streak = 0;
			let currentDate = new Date();
			currentDate.setHours(0, 0, 0, 0);
			
			const sortedCheckins = [...checkins].sort((a, b) => {
				return new Date(b.date) - new Date(a.date);
			});
			
			for (let checkin of sortedCheckins) {
				const checkinDate = new Date(checkin.date);
				checkinDate.setHours(0, 0, 0, 0);
				
				const diffDays = Math.floor((currentDate - checkinDate) / (1000 * 60 * 60 * 24));
				
				if (diffDays === streak) {
					streak++;
					currentDate.setDate(currentDate.getDate() - 1);
				} else {
					break;
				}
			}
			
			return streak;
		},
		
		// 生成海报
		async generatePoster() {
			uni.showLoading({ title: '生成中...' });
			
			uni.vibrateShort({ type: 'medium' });
			
			const ctx = uni.createCanvasContext('posterCanvas', this);
			const width = this.canvasWidth;
			const height = this.canvasHeight;
			
			// 背景渐变
			const gradient = ctx.createLinearGradient(0, 0, 0, height);
			gradient.addColorStop(0, '#000000');
			gradient.addColorStop(1, '#1F2937');
			ctx.setFillStyle(gradient);
			ctx.fillRect(0, 0, width, height);
			
			// 标题
			ctx.setFillStyle('#FFFFFF');
			ctx.setFontSize(36);
			ctx.setTextAlign('center');
			ctx.fillText('睡点儿 Sleep Point', width / 2, 60);
			
			// 副标题
			ctx.setFillStyle('#9CA3AF');
			ctx.setFontSize(18);
			ctx.fillText('我的睡眠成就', width / 2, 100);
			
			// 数据卡片背景
			const cardY = 140;
			const cardHeight = height - 200;
			ctx.setFillStyle('#FFFFFF');
			ctx.setGlobalAlpha(0.95);
			this.roundRect(ctx, 20, cardY, width - 40, cardHeight, 20);
			ctx.fill();
			ctx.setGlobalAlpha(1);
			
			// 连续打卡天数 - 大数字
			ctx.setFillStyle('#000000');
			ctx.setFontSize(80);
			ctx.setTextAlign('center');
			ctx.fillText(this.streakDays.toString(), width / 2, cardY + 120);
			
			// 连续打卡标签
			ctx.setFillStyle('#6B7280');
			ctx.setFontSize(24);
			ctx.fillText('连续打卡天数', width / 2, cardY + 160);
			
			// 分隔线
			ctx.setStrokeStyle('#E5E7EB');
			ctx.setLineWidth(2);
			ctx.beginPath();
			ctx.moveTo(60, cardY + 200);
			ctx.lineTo(width - 60, cardY + 200);
			ctx.stroke();
			
			// 其他统计数据
			const statsY = cardY + 250;
			const leftX = width / 3;
			const rightX = width * 2 / 3;
			
			// 累计天数
			ctx.setFillStyle('#000000');
			ctx.setFontSize(48);
			ctx.setTextAlign('center');
			ctx.fillText(this.totalDays.toString(), leftX, statsY);
			ctx.setFillStyle('#6B7280');
			ctx.setFontSize(20);
			ctx.fillText('累计天数', leftX, statsY + 35);
			
			// 解锁成就
			ctx.setFillStyle('#000000');
			ctx.setFontSize(48);
			ctx.fillText(this.achievementCount.toString(), rightX, statsY);
			ctx.setFillStyle('#6B7280');
			ctx.setFontSize(20);
			ctx.fillText('解锁成就', rightX, statsY + 35);
			
			// 励志语录
			ctx.setFillStyle('#9CA3AF');
			ctx.setFontSize(16);
			ctx.setTextAlign('center');
			const quote = this.getMotivationalQuote();
			ctx.fillText(quote, width / 2, cardY + cardHeight - 80);
			
			// 日期
			const today = new Date();
			const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
			ctx.setFillStyle('#D1D5DB');
			ctx.setFontSize(14);
			ctx.fillText(dateStr, width / 2, cardY + cardHeight - 40);
			
			// 绘制
			ctx.draw(false, () => {
				setTimeout(() => {
					this.canvasToImage();
				}, 500);
			});
		},
		
		// 圆角矩形
		roundRect(ctx, x, y, w, h, r) {
			ctx.beginPath();
			ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
			ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2);
			ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5);
			ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI);
			ctx.closePath();
		},
		
		// Canvas转图片
		canvasToImage() {
			uni.canvasToTempFilePath({
				canvasId: 'posterCanvas',
				success: (res) => {
					this.posterImage = res.tempFilePath;
					uni.hideLoading();
					uni.showToast({
						title: '生成成功',
						icon: 'success'
					});
					uni.vibrateLong();
				},
				fail: (err) => {
					console.error('生成失败', err);
					uni.hideLoading();
					uni.showToast({
						title: '生成失败',
						icon: 'none'
					});
				}
			}, this);
		},
		
		// 保存到相册
		savePoster() {
			if (!this.posterImage) {
				uni.showToast({
					title: '请先生成海报',
					icon: 'none'
				});
				return;
			}
			
			uni.saveImageToPhotosAlbum({
				filePath: this.posterImage,
				success: () => {
					uni.showToast({
						title: '已保存到相册',
						icon: 'success'
					});
					uni.vibrateLong();
				},
				fail: (err) => {
					if (err.errMsg.includes('auth')) {
						uni.showModal({
							title: '需要相册权限',
							content: '请在设置中开启相册权限',
							confirmText: '去设置',
							success: (res) => {
								if (res.confirm) {
									uni.openSetting();
								}
							}
						});
					} else {
						uni.showToast({
							title: '保存失败',
							icon: 'none'
						});
					}
				}
			});
		},
		
		// 获取励志语录
		getMotivationalQuote() {
			const quotes = [
				'每一次准时入睡，都是对自己的温柔',
				'规律作息，遇见更好的自己',
				'好好休息，才能走更远的路',
				'坚持的力量，从每一天开始',
				'给自己一个拥抱，晚安好梦',
				'你的坚持，终将美好'
			];
			return quotes[Math.floor(Math.random() * quotes.length)];
		},
		
		// 返回
		goBack() {
			uni.navigateBack();
		}
	}
};
</script>

<style scoped>
.share-container {
	min-height: 100vh;
	background-color: #F9FAFB;
	padding: 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.poster-canvas {
	position: fixed;
	left: -9999px;
	top: -9999px;
}

.poster-preview {
	width: 100%;
	margin-bottom: 48rpx;
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.poster-image {
	width: 100%;
	display: block;
}

.action-section {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.action-btn {
	width: 100%;
	background-color: #000000;
	border-radius: 16rpx;
	padding: 28rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 12rpx;
	transition: opacity 0.3s;
}

.action-btn:active {
	opacity: 0.8;
}

.action-btn.secondary {
	background-color: #3B82F6;
}

.action-btn.tertiary {
	background-color: #F3F4F6;
}

.action-btn.tertiary .btn-text {
	color: #111827;
}

.btn-icon {
	font-size: 32rpx;
}

.btn-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #FFFFFF;
}

.tip-text {
	margin-top: 24rpx;
	text-align: center;
}

.tip-text text {
	font-size: 24rpx;
	color: #9CA3AF;
}
</style>

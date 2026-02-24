export const timelineData = [
	{
		id: "shenzhen-university-clinical-medicine",
		title: "被深圳大学临床医学录取",
		description: "开始在深圳大学学习临床医学，计划后续转入微电子专业。",
		type: "education",
		startDate: "2025-09-01",
		location: "广东深圳",
		organization: "深圳大学医学部",
		skills: ["高等数学（医）", "医用物理", "医学人际沟通"],
		achievements: [
			"被临床医学专业录取",
			"适应了大学的学习和生活",
			"开始探索对微电子和编程的兴趣",
		],
		icon: "material-symbols:local-hospital",
		color: "#2563EB",
		featured: true,
	},
	{
		id: "advanced-math-for-engineering",
		title: "学习高等数学（为工科打基础）",
		description: "正在学习微积分、线性代数和——这些是微电子学的重要基础。",
		type: "education",
		startDate: "2025-09-01",
		skills: ["微积分", "线性代数"],
		achievements: ["掌握了极限、导数与积分"],
		icon: "mdi:math-compass",
		color: "#8B4513",
	},
	{
		id: "self-learn-programming-tools",
		title: "自学编程与开发工具",
		description: "为准备微电子学习，掌握了VS Code、Git等必备开发工具的使用。",
		type: "achievement",
		startDate: "2025-09-01",
		endDate: "2025-12-15",
		skills: ["VS Code", "Git", "GitHub", "Python基础"],
		achievements: [
			"配置了VS Code并安装实用插件",
			"学习了Git基础：提交、分支、合并",
			"首次将代码推送到GitHub",
		],
		icon: "logos:visual-studio-code",
		color: "#007ACC",
		featured: true,
	},
	{
		id: "explore-microelectronics",
		title: "探索微电子基础知识",
		description: "为转专业做准备，自学电路理论基础、汇编和C语言。",
		type: "achievement",
		startDate: "2025-9-01",
		endDate: "2025-12-20",
		skills: ["数字逻辑", "电路理论", "汇编", "C语言编程"],
		achievements: ["学会用C++"],
		icon: "material-symbols:memory",
		color: "#EA580C",
	},
	{
		id: "plan-to-transfer-microelectronics",
		title: "计划转入微电子专业",
		description: "明确目标：从临床医学转入微电子专业；正在准备相关课程和技能。",
		type: "education",
		startDate: "2026-01-01",
		skills: ["学业规划", "自律"],
		achievements: [
			"调研了微电子专业的课程要求",
			"开始学习数字设计的在线课程",
			"调整了学习计划，增加物理和数学选修课",
		],
		icon: "material-symbols:flag",
		color: "#059669",
		featured: true,
	},
];

// ========== 辅助函数 ==========
export const getTimelineStats = () => {
	const total = timelineData.length;
	const byType = {
		education: timelineData.filter((item) => item.type === "education").length,
		work: timelineData.filter((item) => item.type === "work").length,
		project: timelineData.filter((item) => item.type === "project").length,
		achievement: timelineData.filter((item) => item.type === "achievement")
			.length,
	};
	return { total, byType };
};

export const getTimelineByType = (type?: string) => {
	if (!type || type === "all") {
		return [...timelineData].sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
	}
	return timelineData
		.filter((item) => item.type === type)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
};

export const getFeaturedTimeline = () => {
	return timelineData
		.filter((item) => item.featured)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
};

export const getCurrentItems = () => {
	return timelineData.filter((item) => !item.endDate);
};

export const getTotalWorkExperience = () => {
	const workItems = timelineData.filter((item) => item.type === "work");
	let totalMonths = 0;
	workItems.forEach((item) => {
		const start = new Date(item.startDate);
		const end = item.endDate ? new Date(item.endDate) : new Date();
		const diffMonths =
			(end.getFullYear() - start.getFullYear()) * 12 +
			(end.getMonth() - start.getMonth());
		totalMonths += diffMonths;
	});
	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};

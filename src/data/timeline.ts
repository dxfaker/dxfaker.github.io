// src/data/timeline.ts
export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "education" | "work" | "project" | "achievement";
	startDate: string;
	endDate?: string;
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	achievements?: string[];
	links?: {
		name: string;
		url: string;
		type: "website" | "certificate" | "project" | "other";
	}[];
	icon?: string;
	color?: string;
	featured?: boolean;
}

export const timelineData: TimelineItem[] = [
	{
		id: "shenzhen-university-clinical-medicine",
		title: "Admitted to Clinical Medicine at Shenzhen University",
		description:
			"Started undergraduate studies in Clinical Medicine, planning to transfer to Microelectronics later.",
		type: "education",
		startDate: "2025-09-01",
		location: "Shenzhen, Guangdong",
		organization: "Shenzhen University, School of Medicine",
		skills: ["Human Anatomy", "Physiology", "Medical Terminology"],
		achievements: [
			"Enrolled in Clinical Medicine program",
			"Adapted to university study and life",
			"Began exploring interests in microelectronics and programming",
		],
		icon: "material-symbols:local-hospital",
		color: "#2563EB",
		featured: true,
	},
	{
		id: "advanced-math-for-engineering",
		title: "Studying Advanced Mathematics",
		description:
			"Learning calculus, linear algebra, and probability theory – essential foundation for microelectronics.",
		type: "education",
		startDate: "2025-09-01",
		skills: ["Calculus", "Linear Algebra", "Probability"],
		achievements: [
			"Mastered limits, derivatives, and integrals",
			"Completed matrix operations and vector spaces",
			"Applying probability concepts to engineering problems",
		],
		icon: "mdi:math-compass",
		color: "#8B4513",
	},
	{
		id: "self-learn-programming-tools",
		title: "Self-learning Programming and Tools",
		description:
			"Acquired essential developer tools (VS Code, Git) in preparation for microelectronics studies.",
		type: "achievement",
		startDate: "2025-10-01",
		endDate: "2025-12-15",
		skills: ["VS Code", "Git", "GitHub", "Python Basics"],
		achievements: [
			"Configured VS Code with useful extensions",
			"Learned Git basics: commit, branch, merge",
			"Pushed first code to GitHub",
			"Started learning Python for data analysis and automation",
		],
		icon: "logos:visual-studio-code",
		color: "#007ACC",
		featured: true,
	},
	{
		id: "explore-microelectronics",
		title: "Exploring Microelectronics Fundamentals",
		description:
			"Self-studied basic concepts of digital logic, circuit theory, and embedded systems to prepare for major transfer.",
		type: "achievement",
		startDate: "2025-11-01",
		endDate: "2025-12-20",
		skills: ["Digital Logic", "Circuit Theory", "Arduino", "C Programming"],
		achievements: [
			"Learned Boolean algebra and logic gates",
			"Built simple circuits with Arduino",
			"Wrote basic C programs for microcontroller",
			"Read introductory materials on semiconductor physics",
		],
		icon: "material-symbols:memory",
		color: "#EA580C",
	},
	{
		id: "plan-to-transfer-microelectronics",
		title: "Plan to Transfer to Microelectronics",
		description:
			"Set a clear goal to transfer from Clinical Medicine to Microelectronics; preparing relevant coursework and skills.",
		type: "education",
		startDate: "2026-01-01",
		skills: ["Academic Planning", "Self-Discipline"],
		achievements: [
			"Researched microelectronics program requirements",
			"Started taking online courses in digital design",
			"Adjusted study plan to include physics and math electives",
		],
		icon: "material-symbols:flag",
		color: "#059669",
		featured: true,
	},
];

// ========== 辅助函数（必须导出） ==========
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

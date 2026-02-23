// Skill data configuration file
// Used to manage data for the skill display page

export interface Skill {
	id: string;
	name: string;
	description: string;
	icon: string; // Iconify icon name
	category: "frontend" | "backend" | "database" | "tools" | "other";
	level: "beginner" | "intermediate" | "advanced" | "expert";
	experience: {
		years: number;
		months: number;
	};
	projects?: string[]; // Related project IDs
	certifications?: string[];
	color?: string; // Skill card theme color
}

// Frontend Skills
export const skillsData: Skill[] = [
	{
		id: "vscode",
		name: "VS Code",
		description: "轻量但强大的代码编辑器，拥有丰富的插件生态。",
		icon: "logos:visual-studio-code",
		category: "tools",
		level: "intermediate",
		experience: { years: 1, months: 0 },
		color: "#007ACC",
	},
	{
		id: "git",
		name: "Git",
		description: "分布式版本控制系统，用于代码管理和团队协作。",
		icon: "logos:git-icon",
		category: "tools",
		level: "intermediate",
		experience: { years: 0, months: 8 },
		color: "#F05032",
	},
	{
		id: "visual-studio-insiders",
		name: "Visual Studio Insiders",
		description: "微软的集成开发环境预览版，体验最新功能。",
		icon: "simple-icons:visualstudio", // 如果没有 insiders 专用图标，用这个
		category: "tools",
		level: "beginner",
		experience: { years: 0, months: 3 },
		color: "#5C2D91",
	},
	{
		id: "advanced-math",
		name: "高等数学",
		description: "包括微积分、线性代数、概率论等数学基础。",
		icon: "mdi:math-compass", // 可以用数学相关的图标
		category: "other",
		level: "intermediate",
		experience: { years: 1, months: 6 },
		color: "#8B4513",
	},
];
// Get skill statistics
export const getSkillStats = () => {
	const total = skillsData.length;
	const byLevel = {
		beginner: skillsData.filter((s) => s.level === "beginner").length,
		intermediate: skillsData.filter((s) => s.level === "intermediate").length,
		advanced: skillsData.filter((s) => s.level === "advanced").length,
		expert: skillsData.filter((s) => s.level === "expert").length,
	};
	const byCategory = {
		frontend: skillsData.filter((s) => s.category === "frontend").length,
		backend: skillsData.filter((s) => s.category === "backend").length,
		database: skillsData.filter((s) => s.category === "database").length,
		tools: skillsData.filter((s) => s.category === "tools").length,
		other: skillsData.filter((s) => s.category === "other").length,
	};

	return { total, byLevel, byCategory };
};

// Get skills by category
export const getSkillsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return skillsData;
	}
	return skillsData.filter((s) => s.category === category);
};

// Get advanced skills
export const getAdvancedSkills = () => {
	return skillsData.filter(
		(s) => s.level === "advanced" || s.level === "expert",
	);
};

// Calculate total years of experience
export const getTotalExperience = () => {
	const totalMonths = skillsData.reduce((total, skill) => {
		return total + skill.experience.years * 12 + skill.experience.months;
	}, 0);
	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};

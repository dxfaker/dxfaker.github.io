#!/usr/bin/env node
/**
 * 同步 Astro content 到 Butterfly Hexo
 * 运行: node scripts/sync-to-butterfly.js
 */

import fs from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ASTRO_CONTENT = path.join(ROOT, "src/content");
const BUTTERFLY_SOURCE = path.join(ROOT, "classic/source");

// 使用 jiti 加载 TypeScript 文件
const require = createRequire(import.meta.url);
const jiti = require("jiti")(__filename);

// 同步文章
async function syncPosts() {
	const postsDir = path.join(ASTRO_CONTENT, "posts");
	const targetDir = path.join(BUTTERFLY_SOURCE, "_posts");

	await fs.mkdir(targetDir, { recursive: true });

	const files = await fs.readdir(postsDir);
	const mdFiles = files.filter((f) => f.endsWith(".md"));

	for (const file of mdFiles) {
		const content = await fs.readFile(path.join(postsDir, file), "utf-8");
		const converted = convertAstroToHexo(content);
		await fs.writeFile(path.join(targetDir, file), converted);
	}

	console.log(`✓ 同步了 ${mdFiles.length} 篇文章`);
}

// 同步友链
async function syncFriends() {
	const friendsFile = path.join(ROOT, "src/data/friends.json");
	const targetFile = path.join(BUTTERFLY_SOURCE, "_data/links.yml");

	try {
		const data = await fs.readFile(friendsFile, "utf-8");
		const friends = JSON.parse(data);

		const yaml = friends
			.map(
				(f) => `
${f.title}:
  link: ${f.siteurl}
  avatar: ${f.imgurl}
  descr: ${f.desc}
`,
			)
			.join("");

		await fs.mkdir(path.dirname(targetFile), { recursive: true });
		await fs.writeFile(targetFile, yaml);
		console.log("✓ 同步了友链");
	} catch (e) {
		console.log("✗ 友链同步失败:", e.message);
	}
}

// 同步独立页面（spec 目录下的 md 文件）
async function syncPages() {
	const specDir = path.join(ASTRO_CONTENT, "spec");
	const targetBase = BUTTERFLY_SOURCE;

	try {
		const files = await fs.readdir(specDir);
		const mdFiles = files.filter((f) => f.endsWith(".md"));

		for (const file of mdFiles) {
			const content = await fs.readFile(path.join(specDir, file), "utf-8");
			const pageName = path.basename(file, ".md");
			const targetDir = path.join(targetBase, pageName);
			const targetFile = path.join(targetDir, "index.md");

			await fs.mkdir(targetDir, { recursive: true });
			const converted = convertAstroToHexo(content);
			await fs.writeFile(targetFile, converted);
		}

		console.log(`✓ 同步了 ${mdFiles.length} 个独立页面`);
	} catch (e) {
		console.log("✗ 页面同步失败:", e.message);
	}
}

// 同步数据页面（projects, skills, timeline 等）
async function syncDataPages() {
	const dataDir = path.join(ROOT, "src/data");

	const pages = [
		{
			file: "projects.ts",
			exportName: "projectsData",
			name: "projects",
			generateMarkdown: (items) => {
				if (items.length === 0) return "*暂无项目*\n";
				return items
					.map((item) => {
						const title = item.title || "无标题";
						const desc = item.description || "";
						const demoLink = item.liveDemo
							? ` [🔗 演示](${item.liveDemo})`
							: "";
						const sourceLink = item.sourceCode
							? ` [📦 源码](${item.sourceCode})`
							: "";
						const tech = item.techStack?.length
							? `\n  - 技术栈：${item.techStack.join(", ")}`
							: "";
						const status = item.status ? ` (${item.status})` : "";
						return `- **${title}**${status}：${desc}${demoLink}${sourceLink}${tech}`;
					})
					.join("\n");
			},
		},
		{
			file: "skills.ts",
			exportName: "skillsData",
			name: "skills",
			generateMarkdown: (items) => {
				if (items.length === 0) return "*暂无技能*\n";
				return items
					.map((item) => {
						const name = item.name || "未知技能";
						const levelMap = {
							beginner: "初级",
							intermediate: "中级",
							advanced: "高级",
							expert: "专家",
						};
						const level = levelMap[item.level] || item.level;
						const exp = `${item.experience?.years || 0}年${item.experience?.months || 0}个月`;
						return `- **${name}**：${level}（经验 ${exp}）\n  - ${item.description || ""}`;
					})
					.join("\n");
			},
		},
		{
			file: "timeline.ts",
			exportName: "timelineData",
			name: "timeline",
			generateMarkdown: (items) => {
				if (items.length === 0) return "*暂无时间线*\n";
				const sorted = [...items].sort(
					(a, b) => new Date(b.startDate) - new Date(a.startDate),
				);
				return sorted
					.map((item) => {
						const title = item.title || "事件";
						const date = item.startDate
							? new Date(item.startDate).toLocaleDateString("zh-CN")
							: "";
						const endDate = item.endDate
							? ` 至 ${new Date(item.endDate).toLocaleDateString("zh-CN")}`
							: "";
						const desc = item.description ? `\n  - ${item.description}` : "";
						const achievements = item.achievements?.length
							? `\n  - 成就：${item.achievements.join("、")}`
							: "";
						const skills = item.skills?.length
							? `\n  - 相关技能：${item.skills.join("、")}`
							: "";
						return `- **${title}** (${date}${endDate})${desc}${achievements}${skills}`;
					})
					.join("\n");
			},
		},
	];

	for (const page of pages) {
		const tsPath = path.join(dataDir, page.file);
		const targetDir = path.join(BUTTERFLY_SOURCE, page.name);
		const targetFile = path.join(targetDir, "index.md");

		try {
			const data = jiti(tsPath);
			const items = data[page.exportName];
			if (!Array.isArray(items)) {
				console.log(
					`⚠️  ${page.file} 中未找到数组导出 ${page.exportName}，跳过`,
				);
				continue;
			}

			let mdContent = `---
title: ${page.name.charAt(0).toUpperCase() + page.name.slice(1)}
date: ${new Date().toISOString().split("T")[0]}
---\n\n`;
			mdContent += page.generateMarkdown(items);

			await fs.mkdir(targetDir, { recursive: true });
			await fs.writeFile(targetFile, mdContent);
			console.log(`✓ 同步了 ${page.name} 页面（共 ${items.length} 项）`);
		} catch (e) {
			console.log(`✗ 同步 ${page.name} 失败:`, e.message);
		}
	}
}

// 转换 frontmatter 格式
function convertAstroToHexo(content) {
	return content
		.replace(/^published:\s*(.+)$/m, "date: $1 00:00:00")
		.replace(/^updated:\s*(.+)$/m, "updated: $1 00:00:00")
		.replace(/^category:\s*(.+)$/m, "categories: [$1]")
		.replace(/^toc:\s*(.+)$/m, "toc: $1\ncomments: true");
}

async function main() {
	console.log("🔄 开始同步数据到 Butterfly...\n");

	await syncPosts();
	await syncFriends();
	await syncPages();
	await syncDataPages();

	console.log("\n✅ 同步完成");
}

main().catch(console.error);

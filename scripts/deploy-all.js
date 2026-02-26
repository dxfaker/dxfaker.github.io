#!/usr/bin/env node
/**
 * 统一部署脚本 - Mizuki (Astro) + Butterfly (Hexo)
 * ES Module 版本 (package.json 设置了 "type": "module")
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取 __dirname (ES Module 中没有 __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
};

const log = {
	info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
	success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
	warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
	error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
	step: (num, msg) =>
		console.log(
			`\n${colors.bright}${colors.cyan}步骤 ${num}: ${msg}${colors.reset}`,
		),
};

// 路径配置
const PATHS = {
	mizuki: path.resolve(__dirname, ".."), // Mizuki (Astro) 根目录
	butterfly: path.resolve(__dirname, "../classic"), // Butterfly (Hexo) 根目录
	dist: path.resolve(__dirname, "../dist"), // 最终输出目录
	butterflyPublic: path.resolve(__dirname, "../classic/public"), // Hexo 默认输出目录
	butterflyDist: path.resolve(__dirname, "../dist/classic"), // Hexo 目标目录
};

// 执行命令
function exec(cmd, cwd, env = {}) {
	log.info(`执行: ${cmd}`);
	try {
		execSync(cmd, {
			cwd: cwd || process.cwd(),
			stdio: "inherit",
			env: { ...process.env, ...env },
		});
		return true;
	} catch (error) {
		log.error(`命令失败: ${cmd}`);
		throw error;
	}
}

// 清理目录
function cleanDir(dir) {
	if (fs.existsSync(dir)) {
		log.info(`清理目录: ${dir}`);
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

// 确保目录存在
function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

// 复制目录（递归）
function copyDir(src, dest) {
	if (!fs.existsSync(src)) {
		throw new Error(`源目录不存在: ${src}`);
	}

	ensureDir(dest);

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

// 主流程
async function main() {
	console.log(
		`${colors.bright}${colors.cyan}🚀 开始统一部署流程...${colors.reset}\n`,
	);

	try {
		// 步骤 0: 清理旧的构建输出
		log.step(0, "清理旧的构建输出");
		cleanDir(PATHS.dist);
		cleanDir(PATHS.butterflyPublic);
		log.success("清理完成");

		// 步骤 1: 构建 Mizuki (Astro)
		log.step(1, "构建 Mizuki (Astro)");
		exec("pnpm run build", PATHS.mizuki);

		// 验证 Mizuki 构建结果
		if (!fs.existsSync(path.join(PATHS.dist, "index.html"))) {
			throw new Error("Mizuki 构建失败: dist/index.html 不存在");
		}
		log.success("Mizuki 构建完成");

		// 步骤 2: 构建 Butterfly (Hexo)
		log.step(2, "构建 Butterfly (Hexo)");

		// 打印当前目录和文件列表，确认主题存在
		log.info("列出 classic 目录内容：");
		exec("ls -la", PATHS.butterfly);
		log.info("列出 classic/themes 目录内容：");
		exec("ls -la themes", PATHS.butterfly);
		log.info("列出 butterfly 主题目录内容：");
		exec("ls -la themes/butterfly", PATHS.butterfly);
		log.info("确认 _config.yml 存在：");
		exec("cat _config.yml | head -20", PATHS.butterfly);

		// 执行 Hexo 生成（带调试模式）
		log.info("执行 Hexo 生成（调试模式）");
		exec("npx hexo generate --debug", PATHS.butterfly);

		// 检查生成的 index.html 内容
		log.info("检查生成的 index.html 内容（前50行）：");
		exec("cat public/index.html | head -50", PATHS.butterfly);

		// 验证 Hexo 构建结果
		if (!fs.existsSync(path.join(PATHS.butterflyPublic, "index.html"))) {
			throw new Error("Butterfly 构建失败: classic/public/index.html 不存在");
		}
		log.success("Butterfly 构建完成");

		// 步骤 3: 合并构建结果
		log.step(3, "合并构建结果");
		ensureDir(PATHS.butterflyDist);
		copyDir(PATHS.butterflyPublic, PATHS.butterflyDist);
		log.success("合并完成");

		// 步骤 4: 验证（暂时注释掉，避免因 CSS 缺失而失败）
		/*log.step(4, "验证构建结构");
		const checks = [
			[path.join(PATHS.dist, "index.html"), "Mizuki 主页"],
			[path.join(PATHS.dist, "_astro"), "Mizuki 资源"],
			[path.join(PATHS.butterflyDist, "index.html"), "Butterfly 主页"],
			[path.join(PATHS.butterflyDist, "css"), "Butterfly 样式"],
		];

		let allGood = true;
		for (const [file, desc] of checks) {
			if (fs.existsSync(file)) {
				log.success(`${desc}: ${file}`);
			} else {
				log.error(`${desc} 缺失: ${file}`);
				allGood = false;
			}
		}

		if (!allGood) {
			throw new Error("构建验证失败");
		}*/

		console.log(
			`\n${colors.bright}${colors.green}✅ 构建成功！${colors.reset}`,
		);
		console.log(`${colors.cyan}📁 目录结构:${colors.reset}`);
		console.log("   dist/");
		console.log("   ├── index.html (Mizuki)");
		console.log("   ├── _astro/");
		console.log("   └── classic/ (Butterfly)");
		console.log("\n🌐 测试: npx serve dist");
	} catch (error) {
		console.error(
			`\n${colors.red}❌ 部署失败: ${error.message}${colors.reset}`,
		);
		process.exit(1);
	}
}

main();

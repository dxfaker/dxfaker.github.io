#!/usr/bin/env node
/**
 * 统一部署脚本 - Mizuki (Astro) + Butterfly (Hexo)
 * ES Module 版本 (package.json 设置了 "type": "module")
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const PATHS = {
	mizuki: path.resolve(__dirname, ".."),
	butterfly: path.resolve(__dirname, "../classic"),
	dist: path.resolve(__dirname, "../dist"),
	butterflyPublic: path.resolve(__dirname, "../classic/public"),
	butterflyDist: path.resolve(__dirname, "../dist/classic"),
};

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

function cleanDir(dir) {
	if (fs.existsSync(dir)) {
		log.info(`清理目录: ${dir}`);
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

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

async function main() {
	console.log(
		`${colors.bright}${colors.cyan}🚀 开始统一部署流程...${colors.reset}\n`,
	);

	try {
		log.step(0, "清理旧的构建输出");
		cleanDir(PATHS.dist);
		cleanDir(PATHS.butterflyPublic);
		log.success("清理完成");

		log.step(1, "构建 Mizuki (Astro)");
		exec("pnpm run build", PATHS.mizuki);
		if (!fs.existsSync(path.join(PATHS.dist, "index.html"))) {
			throw new Error("Mizuki 构建失败: dist/index.html 不存在");
		}
		log.success("Mizuki 构建完成");

		log.step(2, "构建 Butterfly (Hexo)");

		// 检查主题是否存在，若不存在则克隆
		const themePath = path.join(PATHS.butterfly, "themes/butterfly");
		const layoutPath = path.join(themePath, "layout");
		if (!fs.existsSync(layoutPath)) {
			log.warning("Butterfly 主题文件缺失，正在重新克隆...");
			exec("rm -rf themes/butterfly", PATHS.butterfly);
			exec(
				"git clone https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly",
				PATHS.butterfly,
			);
			log.info("克隆完成，重新列出主题目录：");
			exec("ls -la themes/butterfly", PATHS.butterfly);
		} else {
			log.info("Butterfly 主题已存在，跳过克隆。");
		}

		log.info("列出 classic 目录内容：");
		exec("ls -la", PATHS.butterfly);
		log.info("列出 butterfly 主题目录内容：");
		exec("ls -la themes/butterfly", PATHS.butterfly);
		log.info("确认 _config.yml 存在：");
		exec("cat _config.yml | head -20", PATHS.butterfly);

		log.info("执行 Hexo 生成（调试模式）");
		exec("npx hexo generate --debug", PATHS.butterfly);

		// 增强 Classic HTML：全屏封面、炫彩边框、粒子特效
		// enhance 修改 classic/ 根下的 HTML，所以从经典根复制而非 public/
		log.info("注入 Classic 增强效果...");
		exec("node scripts/enhance-classic.cjs", PATHS.mizuki);

		// 把增强后的 HTML 同步回 classic/public/（部署从这里读取）
		const CLASSIC_DIRS = ['2026','about','archives','categories','diary','friends','page','projects','skills','tags','timeline'];
		for (const d of CLASSIC_DIRS) {
			const src = path.join(PATHS.butterfly, d);
			const dst = path.join(PATHS.butterflyPublic, d);
			if (fs.existsSync(src)) { ensureDir(dst); copyDir(src, dst); }
		}
		for (const f of ['index.html','404.html']) {
			const src = path.join(PATHS.butterfly, f);
			const dst = path.join(PATHS.butterflyPublic, f);
			if (fs.existsSync(src) && fs.existsSync(path.dirname(dst))) fs.copyFileSync(src, dst);
		}

		log.info("检查生成的 index.html 内容（前50行）：");
		exec("cat public/index.html | head -50", PATHS.butterfly);

		if (!fs.existsSync(path.join(PATHS.butterflyPublic, "index.html"))) {
			throw new Error("Butterfly 构建失败: classic/public/index.html 不存在");
		}
		log.success("Butterfly 构建完成");

		log.step(3, "合并构建结果");
		ensureDir(PATHS.butterflyDist);
		copyDir(PATHS.butterflyPublic, PATHS.butterflyDist);
		log.success("合并完成");

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

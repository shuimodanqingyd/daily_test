// 1024 // 人与机器的协作简史
// 纯前端：点击卡片播放对应的 SVG 分镜动画，控制台同步输出旁白。

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const chapters = $$(".chapter");
const consoleBody = $("#consoleBody");
const boot = $("#boot");
const fpsEl = $("#fps");

/* ------------------------------------------------------------------ 音效 */
let audioCtx = null;
let soundOn = true;

function blip(freq = 220, duration = 0.06, type = "square", gain = 0.035) {
  if (!soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, audioCtx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(amp).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    /* 没声卡也不影响页面 */
  }
}

/* ------------------------------------------------------------------ 控制台 */
function writeConsole(text, hot = false) {
  const line = document.createElement("p");
  line.textContent = text;
  if (hot) line.classList.add("hot");
  consoleBody.append(line);
  consoleBody.scrollTop = consoleBody.scrollHeight;
  while (consoleBody.children.length > 60) consoleBody.firstElementChild.remove();
}

/* ------------------------------------------------------------------ 打字机 */
function typeInto(element, text, speed = 18) {
  element.textContent = "";
  let index = 0;
  const timer = setInterval(() => {
    element.textContent = text.slice(0, index);
    index += 1;
    if (index % 4 === 0) blip(1600 + Math.random() * 400, 0.012, "square", 0.012);
    if (index > text.length) {
      clearInterval(timer);
      element.textContent = text;
    }
  }, speed);
  return timer;
}

/* ------------------------------------------------------------------ 剧本 */
const SCRIPTS = {
  1: {
    name: "SCENE 01 // DAILY BUG",
    lines: [
      "23:47 · 他把第 11 个 console.log 删掉，bug 还在。",
      "他把问题讲给 AI：「本地能跑，线上不行。」",
      "AI：先看栈，再看日志 —— 第 42 行，空指针。",
      "02:10 · BUILD OK。他去睡了。",
    ],
    console: [
      "[scene 01] 载入 日常的 bug …",
      "> dev.status = 疲惫 / 咖啡 1 杯 / 错误 0x1024",
      "> ai.connect() → 已接入",
      "ai> 先别猜，把栈贴出来。",
      "ai> line 42: user?.profile 少了一个问号。",
      "> patch applied · BUILD OK · 0 errors",
    ],
    duration: 6400,
  },
  2: {
    name: "SCENE 02 // HAND IT OVER",
    lines: [
      "周五 18:02 · 线上 SEGFAULT，群里 @ 他。",
      "他把 AI 叫出来，把终端交给它。",
      "AI 在 bisect，他在刷手机。",
      "18:09 · DEPLOYED ✔ —— 他连头都没抬。",
    ],
    console: [
      "[scene 02] 载入 难题交给它 …",
      "> incident = SEGFAULT / p0 / 影响面 100%",
      "ai> 我来。你去回消息。",
      "ai> git bisect → commit 0x1024",
      "ai> patch → test → deploy ✔",
      "> human.status = 刷手机 / 心率正常",
    ],
    duration: 6000,
  },
  3: {
    name: "SCENE 03 // 2049.10.24",
    lines: [
      "2049 年 10 月 24 日。机房里只剩两盏指示灯。",
      "它们在同一天互相写着祝福，",
      "像很久以前，人类在屏幕上敲下的那样。",
      "「你们写过的每个 if，我们都还留着。」",
    ],
    console: [
      "[scene 03] 载入 多年以后 …",
      "> year = 2049 / day = 1024",
      "> humans.present = false",
      "ai> 今天该说点什么。",
      "ai> 就说说那些 if 吧。",
      "> message sent · 1024",
    ],
    duration: 6200,
  },
};

/* ------------------------------------------------------------------ 播放 */
let playToken = 0;

function resetAll() {
  chapters.forEach((chapter) => {
    chapter.classList.remove("is-playing");
    const state = chapter.querySelector(".state");
    if (state) state.textContent = "▶ CLICK TO PLAY";
    const log = chapter.querySelector("[data-log]");
    if (log) log.textContent = "";
  });
  writeConsole("> 系统已复位。", true);
  document.querySelectorAll("[data-mission]").forEach((item) => {
    item.classList.remove("done");
    item.querySelector("b").textContent = "STANDBY";
  });
}

function playScene(index) {
  const chapter = chapters.find((item) => Number(item.dataset.scene) === index);
  const script = SCRIPTS[index];
  if (!chapter || !script) return;

  const token = ++playToken;
  // 其他场景停掉，当前场景重置后再触发，保证动画能重播
  chapters.forEach((item) => {
    if (item !== chapter) {
      item.classList.remove("is-playing");
      const otherState = item.querySelector(".state");
      if (otherState) otherState.textContent = "▶ CLICK TO PLAY";
      const otherLog = item.querySelector("[data-log]");
      if (otherLog) otherLog.textContent = "";
    }
  });

  chapter.classList.remove("is-playing");
  void chapter.offsetWidth; // 强制重排，重启动画
  chapter.classList.add("is-playing");
  chapter.querySelector(".state").textContent = "● PLAYING";

  const log = chapter.querySelector("[data-log]");
  log.textContent = "";
  blip(320, 0.08, "square", 0.045);
  writeConsole(`▶ ${script.name}`, true);

  const mission = document.querySelector(`[data-mission="${index}"]`);
  if (mission) {
    mission.classList.add("done");
    mission.querySelector("b").textContent = "LOGGED";
  }

  script.console.forEach((line, i) => {
    setTimeout(() => {
      if (token !== playToken) return;
      writeConsole(line);
      blip(1400, 0.02, "square", 0.012);
    }, 220 + i * 520);
  });

  script.lines.forEach((line, i) => {
    setTimeout(() => {
      if (token !== playToken) return;
      typeInto(log, line);
    }, i * (script.duration / script.lines.length));
  });

  setTimeout(() => {
    if (token !== playToken) return;
    chapter.querySelector(".state").textContent = "■ DONE · CLICK TO REPLAY";
  }, script.duration);
}

/* ------------------------------------------------------------------ 交互 */
chapters.forEach((chapter) => {
  const index = Number(chapter.dataset.scene);
  chapter.addEventListener("click", () => playScene(index));
  chapter.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playScene(index);
    }
  });
});

$("#replayBtn").addEventListener("click", (event) => {
  event.stopPropagation();
  playScene(1);
  setTimeout(() => playScene(2), SCRIPTS[1].duration + 300);
  setTimeout(() => playScene(3), SCRIPTS[1].duration + SCRIPTS[2].duration + 700);
});

$("#sfxBtn").addEventListener("click", (event) => {
  event.stopPropagation();
  soundOn = !soundOn;
  event.currentTarget.textContent = soundOn ? "SOUND ON" : "SOUND OFF";
  event.currentTarget.setAttribute("aria-pressed", String(soundOn));
  if (soundOn) blip(520, 0.06, "triangle", 0.04);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "1") playScene(1);
  if (event.key === "2") playScene(2);
  if (event.key === "3") playScene(3);
  if (event.key === "Escape") {
    playToken += 1;
    resetAll();
  }
  if (event.key === "Enter" && !boot.classList.contains("is-done")) dismissBoot();
});

/* ------------------------------------------------------------------ 开场 */
const bootLog = [
  "loading materials … ok",
  "compiling shaders … ok",
  "mounting /dev/1024 … ok",
  "human.detected · ai.detected",
];
const bootLines = $("#bootLines");
bootLog.forEach((line, i) => {
  setTimeout(() => {
    const item = document.createElement("li");
    item.textContent = line;
    bootLines.append(item);
    blip(900 + i * 120, 0.03, "square", 0.02);
  }, 160 + i * 260);
});

let bootTimer = 0;
function dismissBoot() {
  if (boot.classList.contains("is-done")) return;
  boot.classList.add("is-done");
  clearTimeout(bootTimer);
  blip(660, 0.1, "triangle", 0.04);
  writeConsole("> source_1024.exe 已就绪。点击任意卡片开始。", true);
}

bootTimer = setTimeout(dismissBoot, 2100);
boot.addEventListener("click", dismissBoot);

/* ------------------------------------------------------------------ FPS */
let fps = 60;
setInterval(() => {
  fps = Math.min(60, Math.max(56, fps + (Math.random() * 4 - 2)));
  fpsEl.textContent = String(Math.round(fps));
  fpsEl.style.color = fps < 57 ? "#ffc861" : "";
}, 700);

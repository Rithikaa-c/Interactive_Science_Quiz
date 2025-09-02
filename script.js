const streakDisplay = document.getElementById('streak-display');
let allQuestions = [];
let workingSet = [];
let currentIndex = 0;
let correctStreak = 0;
let score = 0;
const mysteryBox = document.getElementById('mystery-box');
const mysteryMessage = document.getElementById('mystery-message');
let enableFiftyFifty = false;
let extraTimeNextQ = 0;
let doublePointsNext = false;
let extraLife = false;

let timerEnabled = false;
let timer;
let timeLeft = 20;
const timerDisplay = document.getElementById('timer-display');

const qText = document.getElementById('question-text');
const optionsDiv = document.getElementById('options');
const feedback = document.getElementById('feedback');
const congrats = document.getElementById('congrats');
const nextBtn = document.getElementById('next-btn');
const levelSelect = document.getElementById('level');
const gradeSelect = document.getElementById('grade');
const langSelect = document.getElementById('language');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function init() {
  try {
    const res = await fetch('questions.json');
    allQuestions = await res.json();
  } catch (e) {
    console.error('Failed to load questions.json', e);
    qText.textContent = '❌ Failed to load questions. Check file path.';
    return;
  }

  // restore saved settings
  const savedLang = localStorage.getItem('lang');
  const savedLevel = localStorage.getItem('level');
  const savedGrade = localStorage.getItem('grade');

  if (savedLang) langSelect.value = savedLang;
  if (savedLevel) levelSelect.value = savedLevel;
  if (savedGrade) gradeSelect.value = savedGrade;
}

function startQuiz() {
  score = 0;
  document.getElementById('score-display').textContent = `Score: ${score}`;
  startScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');

  // check if timer is enabled
  timerEnabled = document.getElementById('enable-timer').checked;
  if (timerEnabled) {
    timerDisplay.classList.remove('hidden');
  } else {
    timerDisplay.classList.add('hidden');
  }

  buildWorkingSet();
  renderQuestion();
}



function saveSettings() {
  localStorage.setItem('lang', langSelect.value);
  localStorage.setItem('level', levelSelect.value);
  localStorage.setItem('grade', gradeSelect.value);
}

function buildWorkingSet() {
  const level = levelSelect.value;
  const grade = gradeSelect.value;

  workingSet = allQuestions.filter(
    q => q.level === level && q.grade === grade
  );

  shuffle(workingSet);
  currentIndex = 0;
  correctStreak = 0;
}

function renderQuestion() {
  feedback.textContent = '';
  congrats.textContent = '';
  nextBtn.style.display = "inline-block";

  if (workingSet.length === 0) {
    qText.textContent = '⚠️ No questions found for this grade and level.';
    optionsDiv.innerHTML = '';
    return;
  }

  if (currentIndex >= workingSet.length) {
    qText.textContent = `🎉 Quiz completed! Final Score: ${score}`;
    optionsDiv.innerHTML = '';
    nextBtn.style.display = "none";
    clearInterval(timer);
    launchConfetti();
    return;
  }

  const q = workingSet[currentIndex];
  const lang = langSelect.value;

  qText.textContent = lang === 'en' ? q.question_en : q.question_ta;
  optionsDiv.innerHTML = '';

  const opts = lang === 'en' ? q.options_en : q.options_ta;

  opts.forEach((text, idx) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      clearInterval(timer); // stop timer when answered
      checkAnswer(idx, q.answer);
    });
    optionsDiv.appendChild(btn);
  });

  // ✅ Start timer if enabled (with extra time from Mystery Box)
  if (timerEnabled) {
    clearInterval(timer);
    timeLeft = 20 + extraTimeNextQ; // add bonus time if any
    extraTimeNextQ = 0; // reset after applying
    timerDisplay.textContent = `⏳ Time Left: ${timeLeft}s`;
    timer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `⏳ Time Left: ${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(timer);
        timerDisplay.textContent = "";
        feedback.textContent = lang === 'en' ? "⏳ Time's up!" : "⏳ நேரம் முடிந்தது!";
        feedback.style.color = '#dc2626';
        [...optionsDiv.children].forEach(btn => btn.disabled = true);
      }
    }, 1000);
  }

  // ✅ Apply 50-50 lifeline if enabled
  if (enableFiftyFifty) {
    let wrongOptions = [];
    for (let i = 0; i < opts.length; i++) {
      if (i !== q.answer) wrongOptions.push(i);
    }
    shuffle(wrongOptions);
    wrongOptions.slice(0, 2).forEach(idx => {
      optionsDiv.children[idx].disabled = true;
      optionsDiv.children[idx].style.opacity = 0.5;
    });
    enableFiftyFifty = false; // reset after use
  }
}




function checkAnswer(selected, correct) {
  [...optionsDiv.children].forEach(btn => btn.disabled = true);

  // 🎯 Random feedback messages
  const correctMsgsEn = [
    "✅ Correct! Well done!",
    "🎯 Spot on!",
    "👏 Excellent answer!",
    "💡 You got it right!",
    "🔥 Brilliant!"
  ];
  const wrongMsgsEn = [
    "❌ Wrong! Try the next one!",
    "😬 Not quite right!",
    "🙈 Oops, that’s incorrect!",
    "⚠️ Wrong choice!",
    "🚫 Nope!"
  ];
  const streakMsgsEn = [
    "🔥 You're on fire! Bonus +5!",
    "💡 Brilliant streak! Bonus +5!",
    "🚀 Keep going, genius! Bonus +5!",
    "🎉 3 correct in a row! Bonus +5!",
    "🏆 Streak master! Bonus +5!"
  ];

  const correctMsgsTa = [
    "✅ சரி! அருமை!",
    "🎯 மிகச் சரியாக உள்ளது!",
    "👏 அற்புதம்!",
    "💡 நீங்க கலக்குறீங்க!",
    "🔥 சூப்பர்!"
  ];
  const wrongMsgsTa = [
    "❌ தவறு! மீண்டும் முயற்சி செய்!",
    "😬 சரியில்லை!",
    "🙈 ஓப்ப்ஸ், தவறு!",
    "⚠️ பிழை!",
    "🚫 இல்லை!"
  ];
  const streakMsgsTa = [
    "🔥 சூப்பர்! தொடர்ந்து 3 சரி! கூடுதல் +5!",
    "💡 அற்புதம்! கூடுதல் +5!",
    "🚀 நீ செம்ம வல்லவர்! கூடுதல் +5!",
    "🎉 தொடர்ந்து 3 சரியான பதில்கள்! கூடுதல் +5!",
    "🏆 ஸ்ட்ரீக் மாஸ்டர்! கூடுதல் +5!"
  ];

  const lang = langSelect.value;
  const correctMsgs = lang === 'en' ? correctMsgsEn : correctMsgsTa;
  const wrongMsgs = lang === 'en' ? wrongMsgsEn : wrongMsgsTa;
  const streakMsgs = lang === 'en' ? streakMsgsEn : streakMsgsTa;

if (selected === correct) {
    // ✅ Correct Answer
    feedback.textContent = correctMsgs[Math.floor(Math.random() * correctMsgs.length)];
    feedback.style.color = '#15803d';
    optionsDiv.children[selected].style.background = "#4caf50";

    correctStreak++; // increase streak

    // ⭐ Base points
    let points = 10;
    if (doublePointsNext) {
      points *= 2; // double score
      doublePointsNext = false; // reset after use
    }
    score += points;

    // Update displays
    streakDisplay.textContent = `🔥 Streak: ${correctStreak}/3`;
    document.getElementById('score-display').textContent = `Score: ${score}`;

    // 🎉 Bonus for 3 in a row
    if (correctStreak >= 3) {
      congrats.textContent = streakMsgs[Math.floor(Math.random() * streakMsgs.length)];
      score += 5;
      document.getElementById('score-display').textContent = `Score: ${score}`;
      correctStreak = 0; // reset streak
      streakDisplay.textContent = `🔥 Streak: 0/3`;

      // 🎇 Glow effect + confetti
      qText.style.animation = "glow 1s ease-in-out";
      setTimeout(() => qText.style.animation = "", 1000);
      launchConfetti();
    }

  } else {
    // ❌ Wrong Answer
    if (extraLife) {
      // Use extra life (no penalty)
      feedback.textContent = "💖 Extra Life used! No penalty this time!";
      feedback.style.color = "#0ea5e9";
      extraLife = false; // reset
    } else {
      // Normal wrong penalty
      feedback.textContent = wrongMsgs[Math.floor(Math.random() * wrongMsgs.length)];
      feedback.style.color = '#dc2626';
      score -= 5;
      if (score < 0) score = 0;
    }

    if (selected >= 0) {
      optionsDiv.children[selected].style.background = "#f44336";
    }
    optionsDiv.children[correct].style.background = "#4caf50";

    correctStreak = 0; // reset streak
    streakDisplay.textContent = `🔥 Streak: 0/3`;

    document.getElementById('score-display').textContent = `Score: ${score}`;
  }
}
function nextQuestion() {
  currentIndex++;
   if (currentIndex > 0 && currentIndex % 5 === 0) {
    mysteryBox.classList.remove('hidden');
    mysteryMessage.textContent = "🎁 A Mystery Box Appeared! Open it!";
    return; // stop here until user opens the box
  }
  renderQuestion();
}

function goBackToGrade() {
  quizScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
}
function launchConfetti() {
  let duration = 2 * 1000; // 2 seconds
  let end = Date.now() + duration;

  (function frame() {
    // Left side
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    // Right side
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
function openMysteryBox() {
  const rewards = [
    { text: "⭐ Bonus +20 points!", effect: () => score += 20 },
    { text: "💣 Oops! -10 points!", effect: () => { score -= 10; if (score < 0) score = 0; } },
    { text: "⏳ Extra 5 seconds for next question!", effect: () => extraTimeNextQ = 5 },
    { text: "🎯 50-50 Lifeline: Two wrong options removed!", effect: () => enableFiftyFifty = true },
    { text: "🔥 Double Points for next question!", effect: () => doublePointsNext = true },
    { text: "💖 Extra Life: One wrong answer won’t reduce points!", effect: () => extraLife = true }
  ];

  // Pick random reward
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  // Apply effect
  reward.effect();

  // Show message
  mysteryMessage.textContent = reward.text;

  // Update score display
  document.getElementById('score-display').textContent = `Score: ${score}`;

  // Hide box after a delay and go to next question
  setTimeout(() => {
    mysteryBox.classList.add('hidden');
    renderQuestion();
  }, 2000);
}


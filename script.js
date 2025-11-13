/* QuizMaster++ — AI Python Question Generator Edition */

const API_BASE = 'https://opentdb.com';
const DEFAULT_TIME = 20;
const POINTS_PER_CORRECT = 10;

const el = s => document.querySelector(s);

const setupCard = el('#setupCard');
const questionCard = el('#questionCard');
const resultCard = el('#resultCard');
const qText = el('#qText');
const answersEl = el('#answers');
const qProgress = el('#qProgress');
const timerEl = el('#timer');
const nextBtn = el('#nextBtn');
const liveScoreEl = el('#liveScore');
const correctCountEl = el('#correctCount');
const incorrectCountEl = el('#incorrectCount');
const scoreText = el('#scoreText');
const highscoreEl = el('#highscore');
const amountInput = el('#amountInput');

// ----- Sounds -----
const sounds = {
  correct: new Audio('sounds/correct.mp3'),
  wrong: new Audio('sounds/wrong.mp3'),
  click: new Audio('sounds/click.mp3'),
  timer: new Audio('sounds/timer.mp3'),
};
function playSound(n) {
  const s = sounds[n];
  if (s) {
    s.currentTime = 0;
    s.play().catch(() => {});
  }
}

// ----- Animations -----
function fadeIn(e) {
  e.style.opacity = 0;
  e.classList.remove('hidden');
  e.style.transition = 'opacity 0.4s ease';
  requestAnimationFrame(() => (e.style.opacity = 1));
}
function fadeOut(e) {
  e.style.transition = 'opacity 0.3s ease';
  e.style.opacity = 0;
  setTimeout(() => e.classList.add('hidden'), 300);
}

// ----- Random Utility -----
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ----- AI-Style Python Question Generator -----
function generatePythonQuestions(count = 5) {
  const pythonQs = [];

  const operators = ['+', '-', '*', '//', '%', '**'];
  const dataTypes = [
    ['list', '[]'],
    ['tuple', '()'],
    ['set', '{}'],
    ['dict', '{} with key:value'],
  ];

  for (let i = 0; i < count; i++) {
    const qType = Math.floor(Math.random() * 5);
    let q = {}, code, correct, incorrect;

    switch (qType) {
      case 0: {
        // arithmetic output
        const a = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * 10) + 1;
        const op = rand(operators);
        code = `${a} ${op} ${b}`;
        correct = eval(code).toString();
        incorrect = [
          (eval(code) + 1).toString(),
          (eval(code) - 1).toString(),
          (eval(code) + 2).toString(),
        ];
        q.question = `What is the output of this Python expression?<br><code>${code}</code>`;
        q.correct_answer = correct;
        q.incorrect_answers = incorrect;
        break;
      }
      case 1: {
        // data type identification
        const dt = rand(dataTypes);
        q.question = `What data type does this represent in Python: <code>${dt[1]}</code>?`;
        q.correct_answer = dt[0];
        q.incorrect_answers = dataTypes
          .map(d => d[0])
          .filter(d => d !== dt[0])
          .slice(0, 3);
        break;
      }
      case 2: {
        // keyword question
        const keywords = ['def', 'lambda', 'class', 'return'];
        const correctKw = rand(keywords);
        q.question = `Which Python keyword is used for <b>${
          correctKw === 'def'
            ? 'defining a function'
            : correctKw === 'lambda'
            ? 'creating an anonymous function'
            : correctKw === 'class'
            ? 'defining a class'
            : 'sending a value back from a function'
        }</b>?`;
        q.correct_answer = correctKw;
        q.incorrect_answers = shuffle(keywords.filter(k => k !== correctKw));
        break;
      }
      case 3: {
        // string length
        const word = rand(['hello', 'python', 'AI', 'chat', 'openai']);
        q.question = `What is the output of <code>len("${word}")</code>?`;
        q.correct_answer = String(word.length);
        q.incorrect_answers = [
          String(word.length + 1),
          String(word.length - 1),
          String(word.length + 2),
        ];
        break;
      }
      case 4: {
        // boolean question
        const expr = ['3 > 5', '10 == 10', '7 != 8', '2 < 1'];
        const e = rand(expr);
        q.question = `What is the result of <code>${e}</code>?`;
        q.correct_answer = eval(e).toString();
        q.incorrect_answers = ['True', 'False'].filter(x => x !== q.correct_answer);
        break;
      }
    }

    pythonQs.push(q);
  }

  return pythonQs;
}

// ----- State -----
let questions = [];
let index = 0;
let timer = null;
let timeLeft = DEFAULT_TIME;
let state = { score: 0, correct: 0, incorrect: 0, answers: [] };

// ----- Fetch Trivia -----
async function fetchTrivia(amount = 5) {
  try {
    const res = await fetch(`${API_BASE}/api.php?amount=${amount}&type=multiple`);
    const json = await res.json();
    return json.results.map(q => ({
      question: decodeURIComponent(q.question),
      correct_answer: decodeURIComponent(q.correct_answer),
      incorrect_answers: q.incorrect_answers.map(x => decodeURIComponent(x)),
    }));
  } catch {
    return [];
  }
}

// ----- Game Flow -----
async function startQuiz() {
  playSound('click');
  fadeOut(setupCard);

  const apiQs = await fetchTrivia(5);
  const pyQs = generatePythonQuestions(5);
  questions = shuffle([...apiQs, ...pyQs]);

  state = { score: 0, correct: 0, incorrect: 0, answers: [] };
  index = 0;
  fadeIn(questionCard);
  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  const q = questions[index];
  qText.innerHTML = q.question;
  qProgress.textContent = `Question ${index + 1}/${questions.length}`;
  timeLeft = DEFAULT_TIME;
  timerEl.textContent = timeLeft;

  const options = shuffle([q.correct_answer, ...q.incorrect_answers]);
  answersEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answerBtn';
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(opt);
    answersEl.appendChild(btn);
  });

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 5) playSound('timer');
    if (timeLeft <= 0) handleAnswer(null);
  }, 1000);
}

function handleAnswer(choice) {
  clearInterval(timer);
  const q = questions[index];
  const correct = q.correct_answer;
  const buttons = [...answersEl.children];
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
    else if (b.textContent === choice) b.classList.add('wrong');
  });

  let result = false;
  if (choice === correct) {
    state.correct++;
    state.score += POINTS_PER_CORRECT + (timeLeft > 10 ? 5 : 0);
    playSound('correct');
    result = true;
  } else {
    state.incorrect++;
    playSound('wrong');
  }

  state.answers.push({ ...q, chosen: choice, correct: result });
  liveScoreEl.textContent = state.score;
  correctCountEl.textContent = state.correct;
  incorrectCountEl.textContent = state.incorrect;

  setTimeout(() => {
    index++;
    if (index < questions.length) showQuestion();
    else endQuiz();
  }, 1000);
}

function endQuiz() {
  fadeOut(questionCard);
  fadeIn(resultCard);
  scoreText.textContent = `You scored ${state.score} (${state.correct} correct / ${state.incorrect} incorrect)`;
  const prev = Number(localStorage.getItem('quiz_highscore') || 0);
  if (state.score > prev) localStorage.setItem('quiz_highscore', state.score);
  highscoreEl.textContent = localStorage.getItem('quiz_highscore');
}

el('#startBtn').onclick = startQuiz;
el('#retryBtn').onclick = () => {
  fadeOut(resultCard);
  fadeIn(setupCard);
};

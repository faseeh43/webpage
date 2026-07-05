// Personalize these defaults, or add ?to=HerName&from=YourName to the link.
const CONFIG = {
  to: "my favorite person",
  from: "your favorite troublemaker",
  // Create a free Formspree form, then paste its endpoint here.
  // Example: "https://formspree.io/f/abcdefgh"
  formEndpoint: "",
};

const params = new URLSearchParams(window.location.search);
const person = {
  to: cleanName(params.get("to")) || CONFIG.to,
  from: cleanName(params.get("from")) || CONFIG.from,
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const state = {
  step: 0,
  city: "",
  date: "",
  time: "",
  food: "",
  activity: "",
  noAttempts: 0,
};

const foodsByCity = {
  Antwerp: [
    ["🍣", "Sushi"],
    ["🥩", "Steak"],
    ["🍝", "Pasta / Italian"],
    ["🍛", "Pakistani food"],
    ["🥙", "Lebanese"],
    ["✨", "You choose — surprise me"],
  ],
  Mechelen: [
    ["🍣", "Sushi"],
    ["🥩", "Steak"],
    ["🍝", "Pasta / Italian"],
    ["🥙", "Lebanese"],
    ["✨", "You choose — surprise me"],
  ],
};

const activities = [
  ["🌙", "Walk & talk"],
  ["🎬", "Movie"],
  ["🎳", "Games"],
  ["🍨", "Dessert run"],
  ["🗺️", "Mini adventure"],
  ["🎁", "You choose"],
];

const progress = (active) => `
  <div class="progress" aria-label="Step ${active} of 4">
    ${[1, 2, 3, 4]
      .map((number) => `<span class="progress-dot ${number === active ? "active" : ""}"></span>`)
      .join("")}
  </div>`;

function cleanName(value) {
  return value?.trim().slice(0, 40).replace(/[<>]/g, "");
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function render() {
  const screens = [renderInvite, renderSurprise, renderSchedule, renderFood, renderActivity, renderFinal];
  app.innerHTML = screens[state.step]();
  bindCurrentScreen();
}

function renderInvite() {
  return `
    <div class="screen screen-centered">
      <div class="pup" aria-hidden="true">🧸</div>
      <p class="eyebrow">A tiny question for ${escapeHtml(person.to)}</p>
      <h1>Will you go on a date with me?</h1>
      <p class="subtitle">I have a plan, a little courage, and extremely high hopes.</p>
      <div class="action-zone" id="actionZone">
        <button class="btn btn-secondary" id="noBtn" type="button">No 🙈</button>
        <button class="btn btn-primary" id="yesBtn" type="button">Yes! ♥</button>
      </div>
      <p class="tiny-reaction" id="tinyReaction" aria-live="polite"></p>
    </div>`;
}

function renderSurprise() {
  return `
    <div class="screen screen-centered">
      <div class="surprise-icon" aria-hidden="true">🥹</div>
      <p class="eyebrow">Hold on. This is not a drill.</p>
      <h2>Wait… you actually said yes?!</h2>
      <p class="subtitle">I was emotionally prepared to chase that No button around all day.</p>
      <button class="btn btn-primary btn-wide" id="keepGoing" type="button">Okay, plan our date →</button>
    </div>`;
}

function renderSchedule() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = localDateValue(tomorrow);

  return `
    <div class="screen">
      ${progress(1)}
      <div class="screen-centered">
        <p class="eyebrow">First things first</p>
        <h2>Where and when are you free?</h2>
        <p class="subtitle">Pick our city, a day, and a time. I’ll bring the good conversation.</p>
      </div>
      <form id="scheduleForm">
        <div class="form-grid">
          <div class="field">
            <label for="city">Pick our city 📍</label>
            <select id="city" name="city" required>
              <option value="">Choose a city…</option>
              ${["Antwerp", "Mechelen"]
                .map((city) => `<option ${state.city === city ? "selected" : ""}>${city}</option>`)
                .join("")}
            </select>
          </div>
          <div class="field">
            <label for="date">Pick a day 📅</label>
            <input id="date" name="date" type="date" min="${minDate}" value="${state.date}" required />
          </div>
          <div class="field">
            <label for="time">What time? ⏰</label>
            <select id="time" name="time" required>
              <option value="">Select a time…</option>
              ${["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"]
                .map((time) => `<option ${state.time === time ? "selected" : ""}>${time}</option>`)
                .join("")}
            </select>
          </div>
        </div>
        <button class="btn btn-primary btn-wide" type="submit">Set the date ♥</button>
      </form>
      ${backButton()}
    </div>`;
}

function renderFood() {
  const availableFoods = foodsByCity[state.city] || [];
  return `
    <div class="screen">
      ${progress(2)}
      <div class="screen-centered">
        <p class="eyebrow">Choose our flavor</p>
        <h2>What are we feeling in ${escapeHtml(state.city)}?</h2>
        <p class="subtitle">There are no wrong answers. Except maybe plain celery. 😂</p>
      </div>
      <div class="choices" role="group" aria-label="Choose food">
        ${choiceCards(availableFoods, state.food, "foodChoice")}
      </div>
      <button class="btn btn-primary btn-wide" id="foodNext" type="button">Next: choose the vibe →</button>
      ${backButton()}
    </div>`;
}

function renderActivity() {
  return `
    <div class="screen">
      ${progress(3)}
      <div class="screen-centered">
        <p class="eyebrow">One last decision</p>
        <h2>Pick our date vibe</h2>
        <p class="subtitle">Cute, cozy, competitive, or a little spontaneous?</p>
      </div>
      <div class="choices" role="group" aria-label="Choose an activity">
        ${choiceCards(activities, state.activity, "activityChoice")}
      </div>
      <button class="btn btn-primary btn-wide" id="activityNext" type="button">Make it official ♥</button>
      ${backButton()}
    </div>`;
}

function renderFinal() {
  const readableDate = formatDate(state.date);
  return `
    <div class="screen screen-centered">
      ${progress(4)}
      <p class="eyebrow">It’s officially a date</p>
      <h2>Best “yes” ever.</h2>
      <p class="subtitle">Here’s our tiny plan, ${escapeHtml(person.to)}.</p>
      <div class="summary">
        ${summaryRow("📅", "When", `${readableDate} at ${state.time}`)}
        ${summaryRow("📍", "Where", state.city)}
        ${summaryRow("🍽️", "Food mood", state.food)}
        ${summaryRow("✨", "The vibe", state.activity)}
      </div>
      <p class="final-note">Glad you didn’t say no. I can’t wait.<br />— ${escapeHtml(person.from)}</p>
      <div class="field note-field">
        <label for="dateNote">Anything you want me to know? <span>(optional)</span></label>
        <textarea id="dateNote" rows="3" placeholder="Leave me a little note…"></textarea>
      </div>
      <button class="btn btn-primary btn-wide" id="sendPlan" type="button">Send my choices 💌</button>
      <p class="save-status" id="saveStatus" aria-live="polite"></p>
      ${backButton("Change something")}
    </div>`;
}

function choiceCards(items, selected, className) {
  return items
    .map(
      ([emoji, label]) => `
        <button class="choice ${selected === label ? "selected" : ""} ${className}" type="button" data-value="${label}" aria-pressed="${selected === label}">
          <span class="choice-emoji" aria-hidden="true">${emoji}</span>
          <span class="choice-label">${label}</span>
        </button>`,
    )
    .join("");
}

function summaryRow(icon, label, value) {
  return `
    <div class="summary-row">
      <span class="summary-icon" aria-hidden="true">${icon}</span>
      <div><span class="summary-label">${label}</span><span class="summary-value">${escapeHtml(value)}</span></div>
    </div>`;
}

function backButton(label = "Back") {
  return `<button class="back-button" id="backButton" type="button">← ${label}</button>`;
}

function bindCurrentScreen() {
  if (state.step === 0) bindInvite();
  if (state.step === 1) {
    document.querySelector("#keepGoing").addEventListener("click", () => goTo(2));
  }
  if (state.step === 2) {
    document.querySelector("#scheduleForm").addEventListener("submit", saveSchedule);
  }
  if (state.step === 3) bindChoices(".foodChoice", "food", "#foodNext", 4);
  if (state.step === 4) bindChoices(".activityChoice", "activity", "#activityNext", 5);
  if (state.step === 5) {
    document.querySelector("#sendPlan").addEventListener("click", sendPlan);
    celebrate(42);
  }

  document.querySelector("#backButton")?.addEventListener("click", () => goTo(Math.max(0, state.step - 1)));
}

function bindInvite() {
  const noButton = document.querySelector("#noBtn");
  const yesButton = document.querySelector("#yesBtn");
  const zone = document.querySelector("#actionZone");

  yesButton.addEventListener("click", () => {
    celebrate(34);
    goTo(1);
  });

  const dodge = (event) => {
    if (event.type === "pointerdown") event.preventDefault();
    state.noAttempts += 1;

    const zoneBox = zone.getBoundingClientRect();
    const buttonBox = noButton.getBoundingClientRect();
    const maxX = Math.max(0, zoneBox.width - buttonBox.width);
    const maxY = Math.max(0, zoneBox.height - buttonBox.height);
    let x = Math.random() * maxX;
    let y = Math.random() * maxY;

    // Keep a little breathing room around the Yes button.
    if (x > zoneBox.width * 0.42 && y > zoneBox.height * 0.2 && y < zoneBox.height * 0.78) {
      x = Math.random() * Math.max(1, zoneBox.width * 0.3);
    }

    noButton.style.right = "auto";
    noButton.style.left = `${x}px`;
    noButton.style.top = `${y}px`;
    noButton.style.transform = `rotate(${Math.random() * 12 - 6}deg)`;

    const reactions = [
      "Oops, it’s a little shy.",
      "That button has places to be!",
      "Nice try 😌",
      "It seems oddly committed to avoiding you.",
      "I think the universe is giving you a hint…",
    ];
    document.querySelector("#tinyReaction").textContent = reactions[Math.min(state.noAttempts - 1, reactions.length - 1)];
  };

  noButton.addEventListener("pointerenter", dodge);
  noButton.addEventListener("pointerdown", dodge);
  noButton.addEventListener("click", dodge);
  noButton.addEventListener("focus", dodge);
}

function saveSchedule(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.city = data.get("city");
  state.date = data.get("date");
  state.time = data.get("time");
  const availableFoodNames = (foodsByCity[state.city] || []).map(([, name]) => name);
  if (!availableFoodNames.includes(state.food)) state.food = "";
  goTo(3);
}

function bindChoices(selector, stateKey, nextSelector, nextStep) {
  const choices = [...document.querySelectorAll(selector)];
  choices.forEach((choice) => {
    choice.addEventListener("click", () => {
      state[stateKey] = choice.dataset.value;
      choices.forEach((item) => {
        const isSelected = item === choice;
        item.classList.toggle("selected", isSelected);
        item.setAttribute("aria-pressed", isSelected);
      });
    });
  });

  document.querySelector(nextSelector).addEventListener("click", () => {
    if (!state[stateKey]) {
      showToast("Pick one first — I promise they’re all good choices.");
      return;
    }
    goTo(nextStep);
  });
}

function goTo(step) {
  state.step = step;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function localDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function sendPlan() {
  const button = document.querySelector("#sendPlan");
  const status = document.querySelector("#saveStatus");

  if (!CONFIG.formEndpoint) {
    showToast("Response saving needs to be connected first.");
    status.textContent = "Almost ready — the response form still needs its connection.";
    return;
  }

  button.disabled = true;
  button.textContent = "Sending…";

  try {
    await submitResponse({
      event: "date_plan_completed",
      city: state.city,
      date: state.date,
      time: state.time,
      food: state.food,
      activity: state.activity,
      note: document.querySelector("#dateNote").value.trim() || "No extra note",
    });
    button.textContent = "Sent — see you soon ♥";
    status.textContent = `Your choices went straight to ${person.from}.`;
    celebrate(24);
  } catch {
    button.disabled = false;
    button.textContent = "Try sending again 💌";
    status.textContent = "That didn’t send. Please try once more.";
  }
}

async function submitResponse(details) {
  const response = await fetch(CONFIG.formEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...details,
      invitationFor: person.to,
      invitationFrom: person.from,
      page: window.location.href,
      sentAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) throw new Error("Response could not be saved");
}

async function notifyOpened() {
  if (!CONFIG.formEndpoint || sessionStorage.getItem("invitation-opened-sent")) return;
  sessionStorage.setItem("invitation-opened-sent", "true");

  try {
    await submitResponse({ event: "invitation_opened" });
  } catch {
    sessionStorage.removeItem("invitation-opened-sent");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function celebrate(amount) {
  const colors = ["#b73565", "#ee7da4", "#f8b25e", "#c49ad4", "#f7d365"];
  const container = document.querySelector("#confetti");
  container.replaceChildren();

  for (let index = 0; index < amount; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--fall-time", `${2.4 + Math.random() * 2.2}s`);
    piece.style.setProperty("--drift-x", `${Math.random() * 180 - 90}px`);
    piece.style.setProperty("--spin", `${Math.random() * 900 - 450}deg`);
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    container.append(piece);
  }

  setTimeout(() => container.replaceChildren(), 5200);
}

render();
notifyOpened();

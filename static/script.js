let foodDB = {};
let foods = [];

// ===============================
// 외부 음식 데이터 불러오기
// ===============================
async function loadFoodData() {
  const res = await fetch("/static/food-data.json");
  foodDB = await res.json();
  populateFoodOptions();
}

function populateFoodOptions() {
  const select = document.getElementById("foodName");
  Object.keys(foodDB).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// ===============================
// 음식 추가 / 삭제
// ===============================
function addFood() {
  const name = document.getElementById("foodName").value;
  const amount = parseFloat(document.getElementById("foodAmount").value);
  if (!foodDB[name]) return alert("등록되지 않은 음식입니다.");
  if (!amount || amount <= 0) return alert("섭취량을 정확히 입력해주세요.");

  const id = Date.now();
  foods.push({ id, name, amount });

  const li = document.createElement("li");
  li.className = "list-group-item d-flex justify-content-between align-items-center";
  li.id = `food-${id}`;
  li.innerHTML = `
    ${name} - ${amount}g 
    <button class="btn btn-sm btn-danger" onclick="removeFood(${id})">삭제</button>
  `;
  document.getElementById("foodList").appendChild(li);

  document.getElementById("foodAmount").value = "";
}

function removeFood(id) {
  foods = foods.filter(f => f.id !== id);
  document.getElementById(`food-${id}`).remove();
}

// ===============================
// BMR + 권장 칼로리 계산
// ===============================
function calculateBMR({ height, weight, age, gender }) {
  return gender === "m"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

// ===============================
// 분석 실행
// ===============================
function calculate() {
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const age = parseInt(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const activity = document.getElementById("activity").value;
  const goal = document.getElementById("goal").value;

  if (!height || !weight || !age) return alert("모든 정보를 입력해주세요.");

  const actMult = { low: 1.2, medium: 1.55, high: 1.9 };
  let calories = calculateBMR({ height, weight, age, gender }) * actMult[activity];

  if (goal === "diet") calories -= 500;
  else if (goal === "gain") calories += 500;

  const targets = {
    calories,
    carbs: (calories * 0.5) / 4,
    protein: (calories * 0.3) / 4,
    fat: (calories * 0.2) / 9,
  };

  const total = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  foods.forEach(f => {
    const info = foodDB[f.name];
    const factor = f.amount / 100;
    total.calories += info.calories * factor;
    total.carbs += info.carbs * factor;
    total.protein += info.protein * factor;
    total.fat += info.fat * factor;
  });

  displayResults(total, targets);
  renderChart(total, targets);

  // 서버로 저장
  saveToServer({
    foods,
    user: { height, weight, age, gender, activity, goal },
    date: new Date().toISOString()
  });
}

// ===============================
// 결과 표시
// ===============================
function displayResults(taken, targets) {
  const percent = key => ((taken[key] / targets[key]) * 100).toFixed(0);
  document.getElementById("resultArea").innerHTML = `
    <h5>📌 권장 섭취량</h5>
    <ul>
      <li>칼로리: ${targets.calories.toFixed(2)} kcal</li>
      <li>탄수화물: ${targets.carbs.toFixed(2)} g</li>
      <li>단백질: ${targets.protein.toFixed(2)} g</li>
      <li>지방: ${targets.fat.toFixed(2)} g</li>
    </ul>
    <h5>🍽️ 섭취 총량</h5>
    <ul>
      <li>칼로리: ${taken.calories.toFixed(2)} kcal (${percent("calories")}%)</li>
      <li>탄수화물: ${taken.carbs.toFixed(2)} g (${percent("carbs")}%)</li>
      <li>단백질: ${taken.protein.toFixed(2)} g (${percent("protein")}%)</li>
      <li>지방: ${taken.fat.toFixed(2)} g (${percent("fat")}%)</li>
    </ul>
  `;
}

// ===============================
// Chart.js 시각화
// ===============================
function renderChart(taken, targets) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (window.nutrientChart) window.nutrientChart.destroy();

  const labels = ["칼로리", "탄수화물", "단백질", "지방"];
  const actual = [taken.calories, taken.carbs, taken.protein, taken.fat];
  const expected = [targets.calories, targets.carbs, targets.protein, targets.fat];
  const percent = actual.map((v, i) => ((v / expected[i]) * 100).toFixed(0) + "%");

  window.nutrientChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "섭취량",
          data: actual,
          backgroundColor: "#60a5fa"
        },
        {
          label: "권장량",
          data: expected,
          backgroundColor: "#d1d5db"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            afterLabel: ctx => `달성률: ${percent[ctx.dataIndex]}`
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// ===============================
// 서버로 기록 저장
// ===============================
function saveToServer(payload) {
  fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        alert("✅ 서버에 저장 완료!");
      } else {
        alert("⚠️ 저장 실패");
      }
    })
    .catch(err => {
      alert("❌ 저장 중 오류 발생");
      console.error(err);
    });
}

// ===============================
// 초기 실행
// ===============================
window.onload = () => {
  loadFoodData();
};

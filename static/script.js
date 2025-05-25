const foodData = {
  "닭가슴살": { calories: 165, carbs: 0, protein: 31, fat: 3.6 },
  "고구마": { calories: 86, carbs: 20, protein: 1.6, fat: 0.1 },
  "계란": { calories: 155, carbs: 1.1, protein: 13, fat: 11 },
  "현미밥": { calories: 111, carbs: 23, protein: 2.5, fat: 0.9 },
  "연어": { calories: 208, carbs: 0, protein: 20, fat: 13 },
  "두부": { calories: 76, carbs: 1.9, protein: 8, fat: 4.8 },
  "브로콜리": { calories: 55, carbs: 11, protein: 3.7, fat: 0.6 },
  "바나나": { calories: 89, carbs: 23, protein: 1.1, fat: 0.3 }
};

let eatenFoods = [];
let recommended = {}, total = {};

function addFood() {
  const name = document.getElementById("foodName").value;
  const amount = parseFloat(document.getElementById("foodAmount").value);
  if (!name || !amount) return;
  eatenFoods.push({ name, amount });
  renderFoodList();
}

function renderFoodList() {
  const list = document.getElementById("foodList");
  list.innerHTML = "";
  eatenFoods.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between";
    li.innerHTML = `${item.name} - ${item.amount}g <button class="btn btn-sm btn-danger" onclick="removeFood(${i})">삭제</button>`;
    list.appendChild(li);
  });
}

function removeFood(index) {
  eatenFoods.splice(index, 1);
  renderFoodList();
}

function analyze() {
  const h = parseFloat(document.getElementById("height").value);
  const w = parseFloat(document.getElementById("weight").value);
  const a = parseFloat(document.getElementById("age").value);
  const g = document.getElementById("gender").value;
  const act = document.getElementById("activity").value;

  let bmr = g === "m" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const factor = { low: 1.2, medium: 1.55, high: 1.725 }[act];
  const tdee = bmr * factor;

  recommended = {
    calories: Math.round(tdee),
    carbs: Math.round((tdee * 0.5) / 4),
    protein: Math.round((tdee * 0.2) / 4),
    fat: Math.round((tdee * 0.3) / 9)
  };

  total = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  eatenFoods.forEach(({ name, amount }) => {
    const unit = foodData[name];
    const ratio = amount / 100;
    total.calories += unit.calories * ratio;
    total.carbs += unit.carbs * ratio;
    total.protein += unit.protein * ratio;
    total.fat += unit.fat * ratio;
  });

  const percent = key => ((total[key] / recommended[key]) * 100).toFixed(0);
  document.getElementById("result").classList.remove("d-none");
  document.getElementById("result").innerHTML = `
    <h5>📋 결과 분석</h5>
    <ul>
      <li>🔥 총섭취: ${total.calories.toFixed(0)} kcal</li>
      <li>🍚 탄수화물: ${total.carbs.toFixed(1)}g</li>
      <li>🍗 단백질: ${total.protein.toFixed(1)}g</li>
      <li>🥑 지방: ${total.fat.toFixed(1)}g</li>
    </ul>
    <hr/>
    <ul>
      <li>📌 권장 칼로리: ${recommended.calories} kcal (${percent("calories")}% 달성)</li>
      <li>📌 탄수: ${recommended.carbs}g (${percent("carbs")}% 달성)</li>
      <li>📌 단백질: ${recommended.protein}g (${percent("protein")}% 달성)</li>
      <li>📌 지방: ${recommended.fat}g (${percent("fat")}% 달성)</li>
    </ul>
  `;

  renderPieChart();

  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: ["칼로리", "탄수화물", "단백질", "지방"],
      datasets: [
        {
          label: "섭취량",
          data: [total.calories, total.carbs, total.protein, total.fat],
          backgroundColor: "rgba(0, 123, 255, 0.6)"
        },
        {
          label: "권장량",
          data: [recommended.calories, recommended.carbs, recommended.protein, recommended.fat],
          backgroundColor: "rgba(200, 200, 200, 0.6)"
        }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

function renderPieChart() {
  new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: ["탄수화물", "단백질", "지방"],
      datasets: [{
        data: [total.carbs, total.protein, total.fat],
        backgroundColor: ["blue", "green", "purple"]
      }]
    },
    options: { responsive: true }
  });
}

document.getElementById("recommendBtn").addEventListener("click", () => {
  const resultDiv = document.getElementById("recommendResult");
  const needed = {
    protein: Math.max(0, recommended.protein - total.protein),
    carbs: Math.max(0, recommended.carbs - total.carbs),
    fat: Math.max(0, recommended.fat - total.fat)
  };

  let html = "<h5 class='mb-2'>🥗 맞춤 추천</h5>";

  for (const key of ["protein", "carbs", "fat"]) {
    if (needed[key] <= 0) continue;
    let best = null;
    for (const [name, v] of Object.entries(foodData)) {
      const per100 = v[key];
      if (per100 > 0) {
        const amt = (needed[key] / per100) * 100;
        if (!best || amt < best.amount) {
          best = { name, amount: Math.round(amt), value: (amt * per100 / 100).toFixed(1) };
        }
      }
    }
    if (best) {
      eatenFoods.push({ name: best.name, amount: best.amount });
      html += `<p>🔸 <strong>${key}</strong> ${needed[key].toFixed(1)}g 부족 → <b>${best.name} ${best.amount}g</b></p>`;
    }
  }

  renderFoodList();
  resultDiv.innerHTML = html || "<p class='text-muted'>✅ 부족한 영양소가 없습니다!</p>";
});

document.getElementById("autoMealBtn").addEventListener("click", () => {
  const all = Object.keys(foodData).sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 3) + 3;
  eatenFoods = all.slice(0, count).map(name => ({
    name,
    amount: Math.floor(Math.random() * 100) + 80
  }));
  renderFoodList();
  analyze();
  alert("✅ 랜덤 식단 구성 완료!");
});

document.getElementById("savePlanBtn").addEventListener("click", () => {
  const name = generatePlanName();
  const plans = JSON.parse(localStorage.getItem("plans") || "[]");
  plans.push({ name, foods: [...eatenFoods] });
  localStorage.setItem("plans", JSON.stringify(plans));
  alert(`💾 '${name}' 저장됨`);
  renderSavedPlans();
});

function generatePlanName() {
  const names = ["활력 아침세트", "단백질 강화", "탄수 충전", "클린 플랜", "저탄고단"];
  return names[Math.floor(Math.random() * names.length)];
}

function renderSavedPlans() {
  const ul = document.getElementById("savedPlans");
  const plans = JSON.parse(localStorage.getItem("plans") || "[]");
  ul.innerHTML = plans.length === 0 ? "<li class='text-muted list-group-item'>없음</li>" : "";
  plans.forEach((plan, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-start flex-wrap";
    li.innerHTML = `
      <div>
        <strong>${plan.name}</strong><br/>
        <small>${plan.foods.map(f => `${f.name} ${f.amount}g`).join(", ")}</small>
      </div>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-primary" onclick="loadPlan(${i})">불러오기</button>
        <button class="btn btn-sm btn-danger" onclick="deletePlan(${i})">삭제</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function loadPlan(i) {
  const plans = JSON.parse(localStorage.getItem("plans") || "[]");
  eatenFoods = [...plans[i].foods];
  renderFoodList();
  analyze();
}

function deletePlan(i) {
  const plans = JSON.parse(localStorage.getItem("plans") || "[]");
  if (confirm(`'${plans[i].name}' 식단을 삭제할까요?`)) {
    plans.splice(i, 1);
    localStorage.setItem("plans", JSON.stringify(plans));
    renderSavedPlans();
  }
}

function copySummary() {
  const summary = `
📊 식단 분석 결과
🔥 총섭취: ${total.calories.toFixed(0)} kcal
🍚 탄수화물: ${total.carbs.toFixed(1)}g
🍗 단백질: ${total.protein.toFixed(1)}g
🥑 지방: ${total.fat.toFixed(1)}g
권장 섭취량 대비:
- 칼로리: ${recommended.calories} (${((total.calories / recommended.calories) * 100).toFixed(0)}%)
- 탄수화물: ${recommended.carbs}g
- 단백질: ${recommended.protein}g
- 지방: ${recommended.fat}g
  `.trim();
  navigator.clipboard.writeText(summary).then(() => {
    alert("✅ 분석 결과가 복사되었습니다!");
  });
}

function downloadChart() {
  const canvas = document.getElementById("barChart");
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "식단분석_차트.png";
  link.click();
}

window.addEventListener("DOMContentLoaded", renderSavedPlans);

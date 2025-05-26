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

document.addEventListener("DOMContentLoaded", () => {
  bindSafe("addBtn", addFood);
  bindSafe("analyzeBtn", analyze);
  bindSafe("autoMealBtn", generateAutoMeals);
  bindSafe("copySummary", copySummary);
  bindSafe("downloadChart", downloadChart);
});

function bindSafe(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", handler);
}

function addFood() {
  const name = document.getElementById("foodName").value;
  const amount = parseFloat(document.getElementById("foodAmount").value);
  if (!name || isNaN(amount)) return;
  eatenFoods.push({ name, amount });
  alert(`${name} ${amount}g 추가됨`);
}

function analyze() {
  const h = parseFloat(document.getElementById("height").value);
  const w = parseFloat(document.getElementById("weight").value);
  const a = parseFloat(document.getElementById("age").value);
  const g = document.getElementById("gender").value;
  const act = document.getElementById("activity").value;

  if (!h || !w || !a) return alert("사용자 정보를 모두 입력해주세요.");

  const bmr = g === "m" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const factor = { low: 1.2, medium: 1.55, high: 1.725 }[act];
  const tdee = bmr * factor;

  const recommended = {
    calories: Math.round(tdee),
    carbs: Math.round((tdee * 0.5) / 4),
    protein: Math.round((tdee * 0.2) / 4),
    fat: Math.round((tdee * 0.3) / 9)
  };

  const total = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  eatenFoods.forEach(({ name, amount }) => {
    const food = foodData[name];
    const ratio = amount / 100;
    total.calories += food.calories * ratio;
    total.carbs += food.carbs * ratio;
    total.protein += food.protein * ratio;
    total.fat += food.fat * ratio;
  });

  const resultBox = document.getElementById("result");
  resultBox.classList.remove("d-none");
  resultBox.innerHTML = `
    <p>🔥 <b>칼로리</b>: ${total.calories.toFixed(0)} kcal / 권장 ${recommended.calories} kcal  
      ${getFeedbackLabel(total.calories, recommended.calories)}</p>
    <p>🍚 <b>탄수화물</b>: ${total.carbs.toFixed(1)}g / ${recommended.carbs}g  
      ${getFeedbackLabel(total.carbs, recommended.carbs)}</p>
    <p>🍗 <b>단백질</b>: ${total.protein.toFixed(1)}g / ${recommended.protein}g  
      ${getFeedbackLabel(total.protein, recommended.protein)}</p>
    <p>🥑 <b>지방</b>: ${total.fat.toFixed(1)}g / ${recommended.fat}g  
      ${getFeedbackLabel(total.fat, recommended.fat)}</p>
  `;

  renderCharts(total, recommended);
}

function getFeedbackLabel(actual, target) {
  const rate = (actual / target) * 100;
  const percent = rate.toFixed(0);
  let color = "text-success";
  let message = "💪 적절히 섭취하셨습니다.";

  if (rate < 90) {
    color = "text-danger";
    message = "⚠️ 부족합니다! 조금 더 섭취하세요.";
  } else if (rate > 110) {
    color = "text-warning";
    message = "⚠️ 너무 많이 섭취했습니다. 주의하세요!";
  }

  return `<span class="${color}">${percent}%</span> - ${message}`;
}

function renderCharts(total, recommended) {
  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: ["칼로리", "탄수화물", "단백질", "지방"],
      datasets: [
        {
          label: "섭취량",
          data: [total.calories, total.carbs, total.protein, total.fat],
          backgroundColor: "rgba(0, 123, 255, 0.7)"
        },
        {
          label: "권장량",
          data: [recommended.calories, recommended.carbs, recommended.protein, recommended.fat],
          backgroundColor: "rgba(200, 200, 200, 0.7)"
        }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

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

function generateAutoMeals() {
  const dailyCalories = 2100;
  const mealCalories = dailyCalories / 3;
  const meals = generateMealCombo(mealCalories);
  const output = meals.map(m => `<li>${m.name} ${m.grams}g (${m.calories} kcal)</li>`).join("");

  meals.forEach(m => eatenFoods.push({ name: m.name, amount: m.grams }));

  const box = document.getElementById("autoMealResult");
  box.innerHTML = `
    <h5>🍽️ 자동 식단 추천</h5>
    <ul>${output}</ul>
    <p class="text-success mt-2">✅ 자동으로 식단에 추가됨. 결과 분석 클릭 시 반영됩니다.</p>
  `;
  box.classList.remove("d-none");

  const today = new Date();
  const weekDay = today.toLocaleDateString("ko-KR", { weekday: "long" });

  fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      total: { calories: 0, carbs: 0, protein: 0, fat: 0 },
      foods: meals.map(m => ({ name: m.name, amount: m.grams })),
      type: "추천",
      routine: true,
      weekday: weekDay
    })
  });
}

function generateMealCombo(targetCalories) {
  const macroRatio = { carbs: 0.5, protein: 0.2, fat: 0.3 };
  const macroTargets = {
    carbs: (targetCalories * macroRatio.carbs) / 4,
    protein: (targetCalories * macroRatio.protein) / 4,
    fat: (targetCalories * macroRatio.fat) / 9
  };

  const pickedFoods = [];

  for (const [name, food] of Object.entries(foodData)) {
    const carbScore = Math.abs(food.carbs - macroTargets.carbs / 3);
    const proteinScore = Math.abs(food.protein - macroTargets.protein / 3);
    const fatScore = Math.abs(food.fat - macroTargets.fat / 3);
    const totalScore = carbScore + proteinScore + fatScore;

    pickedFoods.push({ name, food, score: totalScore });
  }

  pickedFoods.sort((a, b) => a.score - b.score);

  return pickedFoods.slice(0, 3).map(({ name, food }) => {
    const grams = Math.round((targetCalories / 3) / food.calories * 100);
    return { name, grams, calories: Math.round(food.calories * (grams / 100)) };
  });
}

function copySummary() {
  const result = document.getElementById("result");
  if (result) {
    navigator.clipboard.writeText(result.innerText);
    alert("📋 결과 복사 완료!");
  }
}

function downloadChart() {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

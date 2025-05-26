let eatenFoods = [];
let foodData = {};

document.addEventListener("DOMContentLoaded", () => {
  // JSON에서 음식 데이터 불러오기
  fetch("/static/food-data.json")
    .then(res => res.json())
    .then(data => {
      foodData = data;
    });

  bindSafe("addBtn", addFood);
  bindSafe("analyzeBtn", analyze);
  bindSafe("copySummary", copySummary);
  bindSafe("downloadChart", downloadChart);
});

function bindSafe(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", handler);
  else console.warn(`⚠️ '${id}' 버튼을 찾을 수 없습니다.`);
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

  if (!h || !w || !a) {
    alert("사용자 정보를 모두 입력해주세요.");
    return;
  }

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

  document.getElementById("result").classList.remove("d-none");
  document.getElementById("result").innerHTML = `
    🔥 섭취 칼로리: ${total.calories.toFixed(0)} kcal<br/>
    🍚 탄수화물: ${total.carbs.toFixed(1)}g / 권장 ${recommended.carbs}g<br/>
    🍗 단백질: ${total.protein.toFixed(1)}g / 권장 ${recommended.protein}g<br/>
    🥑 지방: ${total.fat.toFixed(1)}g / 권장 ${recommended.fat}g
  `;

  renderCharts(total, recommended);

  // ✅ 저장 요청
  fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      total,
      foods: eatenFoods
    })
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === "success") {
      console.log("✅ 저장 완료");
    } else {
      console.warn("❌ 저장 실패:", res.message);
    }
  });
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

function copySummary() {
  const result = document.getElementById("result");
  if (result) {
    navigator.clipboard.writeText(result.innerText);
    alert("결과가 복사되었습니다!");
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

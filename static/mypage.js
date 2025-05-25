let foodDB = {};

// 🌐 음식 데이터 로드
async function loadFoodDB() {
  const res = await fetch("/static/food-data.json");
  foodDB = await res.json();
}

// 📡 사용자 기록 불러오기
async function fetchUserHistory() {
  const res = await fetch("/history");
  return await res.json(); // [{ date, foods, user }, ...]
}

// 📊 평균 영양소 계산 및 그래프
function renderAvgChart(historyList) {
  const totals = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  let days = 0;

  historyList.forEach(record => {
    let daily = { calories: 0, carbs: 0, protein: 0, fat: 0 };
    record.foods.forEach(f => {
      const food = foodDB[f.name];
      if (!food) return;
      const factor = f.amount / 100;
      daily.calories += food.calories * factor;
      daily.carbs += food.carbs * factor;
      daily.protein += food.protein * factor;
      daily.fat += food.fat * factor;
    });

    totals.calories += daily.calories;
    totals.carbs += daily.carbs;
    totals.protein += daily.protein;
    totals.fat += daily.fat;
    days++;
  });

  const averages = {
    calories: (totals.calories / days).toFixed(2),
    carbs: (totals.carbs / days).toFixed(2),
    protein: (totals.protein / days).toFixed(2),
    fat: (totals.fat / days).toFixed(2),
  };

  const ctx = document.getElementById("avgChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["칼로리", "탄수화물", "단백질", "지방"],
      datasets: [{
        label: "평균 섭취량",
        data: [averages.calories, averages.carbs, averages.protein, averages.fat],
        backgroundColor: "#4ade80"
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
}

// 📈 날짜별 칼로리 섭취 그래프
function renderHistoryChart(historyList) {
  const labels = [];
  const calories = [];

  historyList.forEach(record => {
    let total = 0;
    record.foods.forEach(f => {
      const food = foodDB[f.name];
      if (!food) return;
      total += food.calories * (f.amount / 100);
    });

    labels.push(new Date(record.date).toLocaleDateString());
    calories.push(total.toFixed(2));
  });

  const ctx = document.getElementById("calorieChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "칼로리 섭취량",
        data: calories,
        borderColor: "#f97316",
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
}

// 🧾 기록 리스트 출력
function renderRecordList(historyList) {
  const wrapper = document.getElementById("recordList");

  if (historyList.length === 0) {
    wrapper.innerHTML = "<p>📂 저장된 기록이 없습니다.</p>";
    return;
  }

  let html = `<ul class="list-group">`;
  historyList.forEach((record, index) => {
    const date = new Date(record.date).toLocaleString();
    html += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${date}
        <div>
          <button class="btn btn-sm btn-outline-primary me-2" onclick='viewHistory(${index})'>보기</button>
          <button class="btn btn-sm btn-outline-danger" onclick='deleteHistory(${index})'>삭제</button>
        </div>
      </li>
    `;
  });
  html += `</ul>`;
  wrapper.innerHTML = html;
}

// 🔎 기록 보기
function viewHistory(index) {
  const record = window.historyData[index];
  const summary = record.foods.map(f => `${f.name} (${f.amount}g)`).join("\n");
  alert(`📅 날짜: ${new Date(record.date).toLocaleString()}\n\n🍱 음식 목록:\n${summary}`);
}

// ❌ 기록 삭제 (로컬이 아닌 서버 작업 예정이라면 API 필요)
function deleteHistory(index) {
  if (!confirm("이 기록을 삭제할까요?")) return;
  alert("❌ 현재는 로컬에서 삭제 기능이 구현되어 있지 않습니다.\n서버 저장 기반에서는 별도 API가 필요합니다.");
  // TODO: POST /delete API 개발 시 여기에 fetch 요청 추가
}

// 🚀 초기 실행
window.onload = async () => {
  await loadFoodDB();
  const history = await fetchUserHistory();

  window.historyData = history; // 전역 저장

  renderRecordList(history);
  renderAvgChart(history);
  renderHistoryChart(history);
};

let fullLogData = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/history")
    .then(res => res.json())
    .then(data => {
      fullLogData = data;
      renderAvgSummary(data);
      renderChart(data);
      renderLogList(data);
    });
});

function renderAvgSummary(data) {
  const avg = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  if (data.length === 0) return;

  data.forEach(d => {
    avg.calories += d.total.calories || 0;
    avg.carbs += d.total.carbs || 0;
    avg.protein += d.total.protein || 0;
    avg.fat += d.total.fat || 0;
  });

  const len = data.length;
  const list = document.getElementById("avgSummary");
  list.innerHTML = `
    <li>🔥 평균 칼로리: ${(avg.calories / len).toFixed(0)} kcal</li>
    <li>🍚 탄수화물: ${(avg.carbs / len).toFixed(1)}g</li>
    <li>🍗 단백질: ${(avg.protein / len).toFixed(1)}g</li>
    <li>🥑 지방: ${(avg.fat / len).toFixed(1)}g</li>
  `;
}

function renderChart(data) {
  const labels = data.map(d => d.date);
  const carbs = data.map(d => d.total.carbs || 0);
  const protein = data.map(d => d.total.protein || 0);
  const fat = data.map(d => d.total.fat || 0);

  new Chart(document.getElementById("historyChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "탄수화물",
          data: carbs,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.1)",
          fill: true
        },
        {
          label: "단백질",
          data: protein,
          borderColor: "green",
          backgroundColor: "rgba(0,255,0,0.1)",
          fill: true
        },
        {
          label: "지방",
          data: fat,
          borderColor: "purple",
          backgroundColor: "rgba(128,0,128,0.1)",
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderLogList(data) {
  const ul = document.getElementById("logList");
  ul.innerHTML = "";
  if (data.length === 0) {
    ul.innerHTML = "<li class='list-group-item text-muted'>기록이 없습니다.</li>";
    return;
  }

  data.forEach(d => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <strong>${d.date}</strong>
      <span class="badge bg-${d.type === '추천' ? 'info' : 'secondary'} ms-2">${d.type}</span><br/>
      칼로리: ${d.total.calories?.toFixed(0) || '-'} kcal,
      탄: ${d.total.carbs?.toFixed(1) || '-'}g,
      단: ${d.total.protein?.toFixed(1) || '-'}g,
      지: ${d.total.fat?.toFixed(1) || '-'}g
    `;
    ul.appendChild(li);
  });
}

// ✅ 필터 기능: 추천/일반/전체
function filterType(type) {
  const filtered = type === "all" ? fullLogData : fullLogData.filter(d => d.type === type);
  renderLogList(filtered);
}

// ✅ 요일 루틴 필터 기능 (선택적)
function filterRoutineByWeekday(weekday) {
  const filtered = fullLogData.filter(d => d.routine && d.weekday === weekday);
  renderLogList(filtered);
}

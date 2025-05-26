let fullStatsData = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/history")
    .then(res => res.json())
    .then(data => {
      fullStatsData = data;
      filterDays(7); // 기본: 최근 7일
    });
});

function filterDays(days) {
  let filtered = fullStatsData;

  if (days > 0) {
    const today = new Date();
    filtered = fullStatsData.filter(d => {
      const recordDate = new Date(d.date);
      const diff = (today - recordDate) / (1000 * 60 * 60 * 24);
      return diff <= days;
    });
  }

  renderSummary(filtered);
  renderStatChart(filtered);
}

function renderSummary(data) {
  const summary = { calories: 0, carbs: 0, protein: 0, fat: 0 };
  const len = data.length || 1;

  data.forEach(d => {
    summary.calories += d.total.calories || 0;
    summary.carbs += d.total.carbs || 0;
    summary.protein += d.total.protein || 0;
    summary.fat += d.total.fat || 0;
  });

  const avg = {
    calories: (summary.calories / len).toFixed(0),
    carbs: (summary.carbs / len).toFixed(1),
    protein: (summary.protein / len).toFixed(1),
    fat: (summary.fat / len).toFixed(1)
  };

  document.getElementById("summaryList").innerHTML = `
    <li>🔥 총 칼로리: ${summary.calories.toFixed(0)} kcal</li>
    <li>🔥 평균 칼로리: ${avg.calories} kcal</li>
    <li>🍚 평균 탄수화물: ${avg.carbs}g</li>
    <li>🍗 평균 단백질: ${avg.protein}g</li>
    <li>🥑 평균 지방: ${avg.fat}g</li>
  `;
}

function renderStatChart(data) {
  const labels = data.map(d => d.date);
  const carbs = data.map(d => d.total.carbs || 0);
  const protein = data.map(d => d.total.protein || 0);
  const fat = data.map(d => d.total.fat || 0);

  new Chart(document.getElementById("statChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "탄수화물",
          data: carbs,
          borderColor: "blue",
          fill: false
        },
        {
          label: "단백질",
          data: protein,
          borderColor: "green",
          fill: false
        },
        {
          label: "지방",
          data: fat,
          borderColor: "purple",
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

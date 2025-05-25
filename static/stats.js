let allData = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/history")
    .then(res => res.json())
    .then(data => {
      allData = data;
      filterDays(7); // 기본 7일
    });
});

function filterDays(days) {
  const now = new Date();
  let filtered = allData;

  if (days > 0) {
    filtered = allData.filter(d => {
      const date = new Date(d.date);
      const diff = (now - date) / (1000 * 60 * 60 * 24);
      return diff <= days;
    });
  }

  renderSummary(filtered);
  renderStatChart(filtered);
}

function renderSummary(data) {
  const sum = {
    calories: 0, carbs: 0, protein: 0, fat: 0
  };

  if (data.length === 0) {
    document.getElementById("summaryList").innerHTML = "<li>데이터 없음</li>";
    return;
  }

  data.forEach(d => {
    sum.calories += d.total.calories;
    sum.carbs += d.total.carbs;
    sum.protein += d.total.protein;
    sum.fat += d.total.fat;
  });

  const avg = {
    calories: sum.calories / data.length,
    carbs: sum.carbs / data.length,
    protein: sum.protein / data.length,
    fat: sum.fat / data.length
  };

  document.getElementById("summaryList").innerHTML = `
    <li>🔥 총 칼로리: ${sum.calories.toFixed(0)} kcal</li>
    <li>🔥 평균 칼로리: ${avg.calories.toFixed(0)} kcal</li>
    <li>🍚 평균 탄수화물: ${avg.carbs.toFixed(1)}g</li>
    <li>🍗 평균 단백질: ${avg.protein.toFixed(1)}g</li>
    <li>🥑 평균 지방: ${avg.fat.toFixed(1)}g</li>
  `;
}

function renderStatChart(data) {
  const labels = data.map(d => d.date);
  const carbs = data.map(d => d.total.carbs);
  const protein = data.map(d => d.total.protein);
  const fat = data.map(d => d.total.fat);

  new Chart(document.getElementById("statChart"), {
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

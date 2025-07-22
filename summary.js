function toggleMenu() {
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  burger.classList.toggle("open");
  navLinks.classList.toggle("active");
}

document.querySelectorAll("#navLinks a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("navLinks").classList.remove("active");
    document.getElementById("burger").classList.remove("open");
  });
});

function getThailandTodayDate() {
  const today = new Date();
  return today.toLocaleDateString("en-CA");
}
console.log(getThailandTodayDate());

function getThailandTodayDate() {
  const today = new Date();
  return today.toLocaleDateString("en-CA");
}

function loadSalesSummary() {
  const today = getThailandTodayDate();

  fetch("./api/summary.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "date=" + encodeURIComponent(today),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status !== "success") {
        showSummaryError(data.message);
        return;
      }

      const monthlySales = data.data || [];
      console.log(monthlySales);
      const dailySales = data.today || [];
      console.log(dailySales);

      const grouped = {};
      const profitGrouped = {};
      dailySales.forEach((item) => {
        const name = item.product_name;
        const price = parseFloat(item.price);
        const profit = parseFloat(item.profit || 0);

        grouped[name] = (grouped[name] || 0) + price;
        profitGrouped[name] = (profitGrouped[name] || 0) + profit;
      });
      drawSalesPieChart(grouped);
      drawProfitsPieChart(profitGrouped);

      const dailyTotal = dailySales.reduce(
        (sum, item) => sum + (parseFloat(item.price) || 0),
        0
      );

      const dailyProfit = dailySales.reduce(
        (sum, item) => sum + (parseFloat(item.profit) || 0),
        0
      );

      document.getElementById("daily_sales").textContent =
        dailyTotal.toLocaleString() + " Ks";
      document.getElementById("daily_profits").textContent =
        dailyProfit.toLocaleString() + " Ks";

      const monthlyTotal = monthlySales.reduce(
        (sum, item) => sum + (parseFloat(item.price) || 0),
        0
      );

      const monthlyProfit = monthlySales.reduce(
        (sum, item) => sum + (parseFloat(item.profit) || 0),
        0
      );

      document.getElementById("monthly_sales").textContent =
        monthlyTotal.toLocaleString() + " Ks";
      document.getElementById("monthly_profits").textContent =
        monthlyProfit.toLocaleString() + " Ks";

      console.log(monthlyProfit);

      document.getElementById("monthly_sales").textContent =
        monthlyTotal.toLocaleString() + " Ks";
      document.getElementById("monthly_profits").textContent =
        monthlyProfit.toLocaleString() + " Ks";

      const reportDiv = document.getElementById("report");
      if (dailySales.length === 0) {
        reportDiv.innerHTML = `<p>No sales recorded for today (${today}).</p>`;
        return;
      }

      const productSummary = {};
      dailySales.forEach((item) => {
        const name = item.product_name;
        const profit = parseFloat(item.profit || 0);

        if (!productSummary[name]) {
          productSummary[name] = {
            count: 0,
            totalProfit: 0,
          };
        }
        productSummary[name].count += 1;
        productSummary[name].totalProfit += profit;
      });

      let html = `<ul>`;
      for (const [name, info] of Object.entries(productSummary)) {
        html += `<li>${name}: <strong>${
          info.count
        } sold</strong>, profit: <strong>${info.totalProfit.toLocaleString()} Ks</strong></li>`;
      }
      html += `</ul>`;
      reportDiv.innerHTML = html;
    })
    .catch((err) => {
      console.error("🚨 Fetch error:", err);
      showSummaryError(err.message);
    });
}

function drawProfitsPieChart(groupedProfits) {
  const labels = Object.keys(groupedProfits);
  const values = Object.values(groupedProfits);
  const ctx = document.getElementById("profitsPieChart").getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Today's Sales by Product",
          position: "left",
          align: "center",
          font: {
            size: 14,
            weight: "bold",
            lineHeight: 1.2,
          },
          padding: {
            top: 10,
            bottom: 10,
          },
          color: "#384959",
        },
        legend: {
          position: "right",
          labels: {
            padding: 10,
            boxWidth: 30,
          },
        },
      },
      layout: {
        padding: {
          left: 60,
          right: 60,
          top: 10,
          bottom: 10,
        },
      },
    },
  });
}

function drawSalesPieChart(groupedData) {
  const labels = Object.keys(groupedData);
  const values = Object.values(groupedData);
  const ctx = document.getElementById("salesPieChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
            "#858796",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Today's Profit by Product",
          position: "left",
          align: "center",
          font: {
            size: 14,
            weight: "bold",
            lineHeight: 1.2,
          },
          padding: {
            top: 10,
            bottom: 10,
          },
          color: "#384959",
        },
        legend: {
          position: "right",
          labels: {
            padding: 10,
            boxWidth: 30,
          },
        },
      },
      layout: {
        padding: {
          left: 60,
          right: 60,
          top: 10,
          bottom: 10,
        },
      },
    },
  });
}

function showSummaryError(msg) {
  document.getElementById("daily_sales").textContent = "Error";
  document.getElementById("monthly_sales").textContent = "Error";
  document.getElementById("report").innerHTML = `<p>Error: ${msg}</p>`;
}
document.addEventListener("DOMContentLoaded", loadSalesSummary);
function fetchExpiringSoon() {
  fetch("./api/day_left.php")
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        const today = new Date(getThailandTodayDate());
        const tbody = document.getElementById("expiringSoonBody");
        tbody.innerHTML = "";

        let count = 1;

        data.data.forEach((item) => {
          const endDate = new Date(item.end_date);
          const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

          if (daysLeft >= 0 && daysLeft <= 4) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                            <td>${count++}</td>
                            <td>${item.product_name}</td>
                            <td>${item.customer}</td>
                            <td>${item.gmail ?? "-"}</td>
                            <td>${item.purchase_date}</td>
                            <td>${item.end_date}</td>
                            <td>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</td>
                        `;
            tbody.appendChild(tr);
          }
        });
      } else {
        console.error("Server error:", data.message);
      }
    })
    .catch((err) => {
      console.error("Fetch error:", err);
    });
}
document.addEventListener("DOMContentLoaded", fetchExpiringSoon);
function loadProfitChartData() {
  fetch("./api/profit_chart.php")
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        const labels = [];
        const profits = [];
        data.data.forEach((item) => {
          labels.push(item.date);
          profits.push(parseFloat(item.profit));
        });
        drawProfitLineChart(labels, profits);
      } else {
        console.error("Profit data error:", data.message);
      }
    })
    .catch((err) => {
      console.error("Profit chart fetch error:", err);
    });
}
function drawProfitLineChart(labels, profits) {
  const ctx = document.getElementById("profitLineChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Profit (Ks)",
          data: profits,
          borderColor: "#1cc88a",
          backgroundColor: "rgba(28, 200, 138, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Daily Profits (Last 30 Days)",
        },
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 90,
            minRotation: 90,
            autoSkip: true,
            maxTicksLimit: 15,
          },
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Profit (Ks)",
          },
        },
      },
    },
  });
}
document.addEventListener("DOMContentLoaded", loadProfitChartData);

document.addEventListener("DOMContentLoaded", function () {
  fetch("./api/get_latest_summary.php")
    .then((response) => {
      if (!response.ok) throw new Error("No data");
      return response.json();
    })
    .then((data) => {
      const summaryDiv = document.getElementById("summary");
      if (data && data.summary_text) {
        summaryDiv.textContent = data.summary_text;
      } else {
        summaryDiv.textContent = "No summary available.";
      }
    })
    .catch(() => {
      document.getElementById("summary").textContent = "No summary available.";
    });
});

// ========== NAVIGATION TOGGLE ==========
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
  return today.toLocaleDateString("en-CA"); // returns 'YYYY-MM-DD'
}
console.log(getThailandTodayDate());

function getThailandTodayDate() {
  const today = new Date();
  return today.toLocaleDateString("en-CA"); // e.g. 2025-07-21
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
      if (data.status !== "success") return showSummaryError(data.message);

      const monthlySales = data.data || []; // Full current month
      console.log(monthlySales);
      const dailySales = data.today || []; // Only today
      console.log(dailySales);

      // === Pie Chart (Monthly) ===
      const grouped = {};
      monthlySales.forEach((item) => {
        const name = item.product_name;
        const price = parseFloat(item.price);
        grouped[name] = (grouped[name] || 0) + price;
      });
      drawSalesPieChart(grouped);

      // === Daily Sales Total ===
      const dailyTotal = dailySales.reduce(
        (sum, item) => sum + parseFloat(item.price),
        0
      );
      document.getElementById(
        "daily_sales"
      ).textContent = `${dailyTotal.toLocaleString()} Ks`;

      // === Monthly Sales Total ===
      const monthlyTotal = monthlySales.reduce(
        (sum, item) => sum + parseFloat(item.price),
        0
      );
      document.getElementById(
        "monthly_sales"
      ).textContent = `${monthlyTotal.toLocaleString()} Ks`;

      // === Monthly Profit Total ===
      const monthlyProfit = monthlySales.reduce(
        (sum, item) => sum + parseFloat(item.profit || 0),
        0
      );
      document.getElementById(
        "monthly_profits"
      ).textContent = `${monthlyProfit.toLocaleString()} Ks`;

      // === Daily Product Breakdown ===
      const reportDiv = document.getElementById("report");
      if (dailySales.length === 0) {
        reportDiv.innerHTML = `<p>No sales recorded for today (${today}).</p>`;
        return;
      }

      const productSummary = {};
      dailySales.forEach((item) => {
        const name = item.product_name;
        const profit = parseFloat(item.profit || 0);
        if (!productSummary[name])
          productSummary[name] = { count: 0, totalProfit: 0 };
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
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
          },
        },
        title: {
          display: true,
          text: "Today's Sales by Product",
        },
      },
      layout: {
        padding: 20,
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
                            <td>${item.gmail}</td>
                            <td>${item.purchase_date}</td>
                            <td>${item.end_date}</td>
                            <td>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</td>
                        `;
            tbody.appendChild(tr);
          }
        });
      } else {
        console.error("❌ Server error:", data.message);
      }
    })
    .catch((err) => {
      console.error("🚨 Fetch error:", err);
    });
}

document.addEventListener("DOMContentLoaded", fetchExpiringSoon);

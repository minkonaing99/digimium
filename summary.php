<?php
session_start();

if (!isset($_SESSION['username']) && isset($_COOKIE['username'])) {
    $_SESSION['username'] = $_COOKIE['username'];
    $_SESSION['privilege'] = $_COOKIE['privilege'];
    $_SESSION['logincode'] = $_COOKIE['logincode'];
}

// Allow list
$allowedPrivileges = ['admin', 'staff'];
$allowedLogincodes = ['200068', '200038'];

if (
    (isset($_SESSION['privilege']) && in_array($_SESSION['privilege'], $allowedPrivileges)) ||
    (isset($_SESSION['logincode']) && in_array($_SESSION['logincode'], $allowedLogincodes))
) {
    // allow access
} else {
    header("Location: index.php");
    exit();
}

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Summary</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <header id="navbar">
        <div class="logo" aria-label="Home"><a href="./index.php"><img src="./assets/logo_digimium.png" alt=""></a></div>


        <nav>
            <div class="nav-links" id="navLinks">
                <a href="./home.php" aria-label="Home">Home</a>
                <?php if (isset($_SESSION['privilege']) && $_SESSION['privilege'] === 'admin'): ?>
                    <a href="./admin.php" aria-label="Admin">Admin</a>
                    <a href="./summary.php" aria-label="Summary">Summary</a>
                <?php endif; ?>
                <button class="contact-btn" onclick="window.location.href='./api/logout.php'" aria-label="LogOut">Log
                    Out</button>
            </div>
            <div class="burger" id="burger" onclick="toggleMenu()" aria-label="Menu Toggle">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </nav>

    </header>
    <div class="container-fluid">
        <section class="menu-bar p-5 py-3">

            <div class="row d-flex justify-content-between align-items-center">
                <div class="col text-start">
                    <h1>Summary</h1>
                </div>
                <div class="col text-end">
                </div>
            </div>
        </section>
        <section class="summary-section px-5">
            <div class="row justify-content-center">
                <div class="showcase">
                    <div class="title">Daily Sales</div>
                    <div class="amount" id="daily_sales">$1,250</div>
                </div>
                <div class="showcase">
                    <div class="title">Daily Profits</div>
                    <div class="amount" id="daily_profits">$1,250</div>
                </div>
                <div class="showcase">
                    <div class="title">Monthly Sales</div>
                    <div class="amount" id="monthly_sales">$1,250</div>
                </div>
                <div class="showcase">
                    <div class="title">Monthly Profits</div>
                    <div class="amount" id="monthly_profits">$1,250</div>
                </div>
            </div>
            <div class="row">
                <h3 class="col-12">Daily Product Sold</h3>

                <div class="col-md-6 col-12">
                    <div style="height: 100%; max-height: 40vh; margin: auto;">
                        <canvas id="salesPieChart"></canvas>
                    </div>
                </div>
                <div class="col-md-6 col-12" id="report">
                    This is the report
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <h3>Expire Soon</h3>
                    <div class="table-responsive">
                        <table class="table align-middle table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Product Name</th>
                                    <th>Customer</th>
                                    <th>Email</th>
                                    <th>Purchased Date</th>
                                    <th>Expired Date</th>
                                    <th>Date Left</th>
                                </tr>
                            </thead>
                            <tbody id="expiringSoonBody">

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <canvas id="monthlyProfitLineChart" height="100"></canvas>
        </section>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- <script src="summary.js"></script> -->
    <script>
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
                    if (data.status === "success") {
                        const sales = data.data;
                        console.log(sales);

                        // === Pie Chart Data ===
                        const grouped = {};
                        sales.forEach((item) => {
                            const name = item.product_name;
                            const price = parseFloat(item.price);
                            grouped[name] = (grouped[name] || 0) + price;
                        });
                        drawSalesPieChart(grouped);

                        // === Daily Amount ===
                        const dailyTotal = sales.reduce(
                            (sum, item) => sum + parseFloat(item.price),
                            0
                        );
                        document.getElementById(
                            "daily_sales"
                        ).textContent = `${dailyTotal.toLocaleString()} Ks`;

                        // === Monthly Amount (same data because backend filters by month already) ===
                        document.getElementById(
                            "monthly_sales"
                        ).textContent = `${dailyTotal.toLocaleString()} Ks
                        `;

                        // === Daily Product Report ===
                        const productCount = {};
                        sales.forEach((item) => {
                            const name = item.product_name;
                            productCount[name] = (productCount[name] || 0) + 1;
                        });
                        // === Monthly Profit ===
                        const monthlyProfit = sales.reduce(
                            (sum, item) => sum + parseFloat(item.profit || 0),
                            0
                        );
                        document.getElementById(
                            "monthly_profits"
                        ).textContent = `${monthlyProfit.toLocaleString()} Ks`;
                        // === Daily Profit ===
                        const dailyProfit = sales.reduce(
                            (sum, item) => sum + parseFloat(item.profit || 0),
                            0
                        );
                        document.getElementById("daily_profits").textContent = `${dailyProfit.toLocaleString()} Ks`;


                        const reportDiv = document.getElementById("report");

                        if (sales.length === 0) {
                            reportDiv.innerHTML = `<p>No sales recorded for today (${today}).</p>`;
                        } else {
                            // Group sales by product name
                            const productSummary = {};

                            sales.forEach((item) => {
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

                            // Build and display report
                            let html = `<ul>`;
                            for (const [name, data] of Object.entries(productSummary)) {
                                html += `<li>${name}: <strong>${
              data.count
            }  sold </strong>,  profit : <strong>${data.totalProfit.toLocaleString()} Ks
        </strong></li>`;
                            }
                            html += `</ul>`;
                            reportDiv.innerHTML = html;
                        }
                    } else {
                        showSummaryError(data.message);
                    }
                })
                .catch((err) => {
                    console.error("🚨 Fetch Error:", err);
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
                    datasets: [{
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
                    }, ],
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
                            <td>${item.gmail ?? "-"}</td>
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
    </script>
</body>

</html>
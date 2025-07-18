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
        <div class="logo" aria-label="Home"><a href="#"><img src="./assets/logo_digimium.png" alt=""></a></div>
        <nav>
            <div class="nav-links" id="navLinks">
                <a href="./home.php" aria-label="Home">Home</a>
                <?php if (isset($_SESSION['privilege']) && $_SESSION['privilege'] === 'admin'): ?>
                    <a href="./admin.php" aria-label="Admin">Admin</a>
                <?php endif; ?>
                <a href="./summary.php" aria-label="Summary">Summary</a>
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
                                    <th>Customer</th>
                                    <th>Product Name</th>
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
    <script src="summary.js"></script>
</body>

</html>
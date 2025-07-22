<?php
session_start();

if (!isset($_SESSION['username']) && isset($_COOKIE['username'], $_COOKIE['privilege'], $_COOKIE['logincode'])) {
    $_SESSION['username'] = $_COOKIE['username'];
    $_SESSION['privilege'] = $_COOKIE['privilege'];
    $_SESSION['logincode'] = $_COOKIE['logincode'];
}

$allowedPrivileges = ['admin', 'owner'];
$allowedLogincodes = ['200068'];

if (
    isset($_SESSION['privilege'], $_SESSION['logincode']) &&
    in_array($_SESSION['privilege'], $allowedPrivileges) &&
    in_array($_SESSION['logincode'], $allowedLogincodes)
) {
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
            <?php $currentPage = basename($_SERVER['PHP_SELF']); ?>
            <div class="nav-links" id="navLinks">
                <a href="./retail_sales_overview.php">
                    Sales Overview
                </a>

                <?php if (isset($_SESSION['privilege']) && ($_SESSION['privilege'] === 'admin' || $_SESSION['privilege'] === 'owner')): ?>
                    <a href="./retail_product_catalog.php"
                        class="<?= $currentPage === 'retail_product_catalog.php' || $currentPage === 'wholesale_product_catalog.php' ? 'active' : '' ?>"
                        aria-label="Product Catalog">Product Catalog</a>
                    <a href="./summary.php"
                        class="<?= $currentPage === 'summary.php' ? 'active' : '' ?>"
                        aria-label="Summary">Summary</a>
                <?php endif; ?>

                <button class="contact-btn" onclick="window.location.href='./api/logout.php'" aria-label="LogOut">
                    Log Out
                </button>
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
                <div class="col-md-4 col-12">
                    <div style="height: 100%; max-height: 50vh; margin: auto;">
                        <canvas id="salesPieChart"></canvas>
                    </div>
                </div>
                <div class="col-md-4 col-12">
                    <div style="height: 100%; max-height: 50vh; margin: auto;">
                        <canvas id="profitsPieChart"></canvas>
                    </div>
                </div>
                <div class="col-md-4 col-12 d-flex justify-content-center align-items-center" id="report"
                    style="height: 100%; max-height: 50vh; margin: auto; text-align: left;">
                    This is the report
                </div>
            </div>
            <div class="row">
                <div class="col-12 mt-3">

                    <div class="row justify-content-center">
                        <div class="col-12 col-md-8 text-center p-5">
                            <div id="summary">Loading summary...</div>
                        </div>
                    </div>

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
            <div class="row mt-3">
                <h3 class="col-12">30-Day Performance</h3>
                <div class="chart-container" style="position: relative; height:40vh;">
                    <canvas id="profitLineChart"></canvas>
                </div>
            </div>
        </section>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="summary.js"></script>
</body>

</html>
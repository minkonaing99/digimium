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
        <section class="menu-bar p-md-5 py-md-3  pb-md-0 p-1">
            <div class="row d-flex justify-content-between align-items-center">
                <div class="col text-start">
                    <h1>Summary</h1>
                </div>
            </div>

        </section>
        <section class="summary-section px-md-5 p-0">
            <div class="row justify-content-center">
                <div class="showcase">
                    <div class="title">Daily Sales</div>
                    <div class="amount" id="daily_sales">Loading ...</div>
                </div>
                <div class="showcase">
                    <div class="title">Daily Profits</div>
                    <div class="amount" id="daily_profits">Loading ...</div>
                </div>
                <div class="showcase">
                    <div class="title">Monthly Sales</div>
                    <div class="amount" id="monthly_sales">Loading ...</div>
                </div>
                <div class="showcase">
                    <div class="title">Monthly Profits</div>
                    <div class="amount" id="monthly_profits">Loading ...</div>
                </div>

            </div>
            <div class="row justify-content-center">
                <div class="alert alert-success alert-dismissible fade show mt-2 col-11 col-md-8 position-relative p-2 text-center" role="alert">
                    <button type="button" class="btn-close position-absolute top-0 end-0 m-0 p-2" data-bs-dismiss="alert" aria-label="Close"></button>
                    <div id="summary">
                        Loading summary...
                    </div>
                </div>
            </div>
            <div class="row mt-md-2 ">
                <h3 class="col-12">Daily Product Sold</h3>
                <div class="col-md-4 col-12">
                    <div class="chart-row">
                        <canvas id="salesPieChart"></canvas>
                    </div>
                </div>
                <div class="col-md-4 col-12">
                    <div class="chart-row">
                        <canvas id="profitsPieChart"></canvas>
                    </div>
                </div>
                <div class="col-md-4 col-12 d-flex justify-content-center align-items-center chart-row" id="report">
                    This is the report
                </div>
            </div>
            <div class="col-12 mt-3">
                <h3>Expire Soon</h3>
                <div id="expiringSoonMobile">
                    <div class="row p-3 d-flex d-md-none">
                    </div>
                </div>
                <div class="table-responsive d-none d-md-block">
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


            <div class="row mt-3">
                <h3 class="col-12">30-Day Performance</h3>
                <div class="chart-container" style="position: relative; height:40vh;">
                    <canvas id="profitLineChart"></canvas>
                </div>
            </div>
        </section>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js" integrity="sha384-ndDqU0Gzau9qJ1lfW4pNLlhNTkCfHzAVBReH9diLvGRem5+R9g2FzA8ZGN954O5Q" crossorigin="anonymous"></script>
    <script src="summary.js"></script>
</body>

</html>
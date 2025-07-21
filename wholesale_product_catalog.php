<?php
session_start();

if (! isset($_SESSION['username']) && isset($_COOKIE['username'], $_COOKIE['privilege'], $_COOKIE['logincode'])) {
    $_SESSION['username']  = $_COOKIE['username'];
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
    <title>Admin Dashboard</title>
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
            <div class="row d-flex align-items-center">
                <div class="col text-start">
                    <h1>Wholesale | <a href="./retail_product_catalog.php" class="title_link">Retail</a></h1>

                </div>
                <div class="col d-flex justify-content-end">
                    <div class="btn-group">
                        <button class="contact-btn menu-btn" id="addBtn">Add Product</button>
                    </div>
                </div>
            </div>
        </section>
        <section class="table-section">
            <div id="inputRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
                <!-- form staring point -->
                <form>
                    <div class="row g-3 align-items-end">
                        <div class="col-12 col-md">
                            <label for="product" class="form-label">Product</label>
                            <input type="text" class="form-control form-control-sm" id="product" placeholder="Product">
                        </div>

                        <div class="col-12 col-md">
                            <label for="duration" class="form-label">Duration</label>
                            <input type="number" class="form-control form-control-sm" id="duration"
                                placeholder="Duration">
                        </div>

                        <div class="col-12 col-md">
                            <label for="supplier" class="form-label">Supplier</label>
                            <input type="text" class="form-control form-control-sm" id="supplier"
                                placeholder="Supplier">
                        </div>

                        <div class="col-12 col-md">
                            <label for="wc_price" class="form-label">WS Price</label>
                            <input type="number" class="form-control form-control-sm" id="wc_price">
                        </div>

                        <div class="col-12 col-md">
                            <label for="retail_price" class="form-label">Retail Price</label>
                            <input type="number" class="form-control form-control-sm" id="retail_price">
                        </div>

                        <div class="col-12 col-md">
                            <label for="Notes" class="form-label">Notes</label>
                            <input type="text" class="form-control form-control-sm" id="Notes" placeholder="Note"
                                autocomplete="off">
                        </div>

                        <div class="col-12 col-md">
                            <label for="link" class="form-label">Link</label>
                            <input type="text" class="form-control form-control-sm" id="link" placeholder="Link"
                                autocomplete="off">
                        </div>

                        <div class="col-12 col-md-auto">
                            <button type="submit" class="contact-btn menu-btn">Save</button>
                        </div>
                    </div>
                </form>
            </div>
            <div id="editRow" style="display: none;" class="mb-3 p-3 border rounded bg-light">
            </div>
            <div class="table-responsive">
                <table class="table align-middle table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Duration</th>
                            <th>Supplier</th>
                            <th>Note</th>
                            <th>Link</th>
                            <th style="text-align: right; padding-right: 1.2rem">WS Price</th>
                            <th style="text-align: right; padding-right: 1.2rem">Retail Price</th>
                            <th>Set</th>
                        </tr>
                    </thead>
                    <tbody id="productTableBody">
                    </tbody>
                </table>
            </div>

        </section>
    </div>
    <script src="./wc_product_page.js"></script>
</body>

</html>
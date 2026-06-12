<?php
declare(strict_types=1);

$role = strtolower((string)($_SESSION['user']['role'] ?? ''));
$username = htmlspecialchars((string)($_SESSION['user']['username'] ?? 'Guest'), ENT_QUOTES);
$roleLabel = $role !== '' ? htmlspecialchars(ucfirst($role), ENT_QUOTES) : 'Guest';
?>
<header id="navbar">
    <div class="logo" aria-label="Home">
        <a href="./sales_overview.php"><img src="./assets/logo_digimium.png" alt="Digimium"></a>
    </div>

    <nav aria-label="Primary">
        <div class="nav-links" id="navLinks">
            <a href="sales_overview.php">Sales Overview</a>
            <?php if (in_array($role, ['admin', 'owner'], true)): ?>
                <a href="product_catalog.php" aria-label="Product Catalog">Product Catalog</a>
                <a href="summary.php" aria-label="Summary">Summary</a>
            <?php endif; ?>
            <?php if ($role === 'owner'): ?>
                <a href="user_list.php" aria-label="User List">User List</a>
            <?php endif; ?>

            <div class="nav-user" data-role="<?= htmlspecialchars($role, ENT_QUOTES) ?>">
                <a href="#" id="logoutBtn" class="nav-user-logout" aria-label="Log Out">Log out</a>
            </div>
        </div>

        <button class="burger" id="burger" aria-label="Menu Toggle">
            <div></div>
            <div></div>
            <div></div>
        </button>
    </nav>
</header>

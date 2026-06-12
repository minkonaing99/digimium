<?php

declare(strict_types=1);
// Owner-only user management screen.
// Data operations (list/create/delete) are handled in `js/user_list.js`
// via API endpoints under `api/user_*.php`.
require __DIR__ . '/api/session_bootstrap.php';
require __DIR__ . '/api/auth.php';

auth_require_login(['owner']);

$role = ucfirst($_SESSION['user']['role'] ?? '');
$user = htmlspecialchars($_SESSION['user']['username'] ?? 'Guest', ENT_QUOTES);
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="<?= htmlspecialchars(csrf_token(), ENT_QUOTES) ?>">
    <title>Digimium • User</title>
    <?php foreach (\Digimium\Core\Assets::tagsFor('user.css') as $href): ?>
        <link rel="stylesheet" href="<?= htmlspecialchars($href, ENT_QUOTES) ?>">
    <?php endforeach; ?>
</head>

<body>
    <?php require __DIR__ . '/app/partials/nav.php'; ?>

    <main class="page" role="main">



        <section class="era-table-card mb">
            <div class="menu-bar">
                <h2 id="product_catalog" class="era-table-title">User List</h2>

                <div class="btn-group">

                    <button id="userSettingBtn" class="iconLabelBtn catalogPage"><img src="./assets/user.svg"
                            alt="editUser">
                        <span class="btnLabel">User Setting</span></button>
                </div>
            </div>
        </section>


        <!-- User Settings Form -->
        <section class="era-table-card mb" id="user_setting" style="display: none;">
            <div class="menu-bar">
                <h2 class="era-table-title">User Setting</h2>
            </div>
            <div id="addUserRow" class="input-form">
                <form>
                    <div class="form-row">
                        <div class="form-col">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" id="username" placeholder="Username" autocomplete="off">
                        </div>
                        <div class="form-col">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" id="password" placeholder="Password" autocomplete="off">
                        </div>
                        <div class="form-col">
                            <label for="role" class="form-label">Role</label>
                            <select id="role">
                                <option disabled>Choose...</option>
                                <option selected>Staff</option>
                                <option>Admin</option>
                            </select>
                        </div>

                        <div class="form-col form-submit">
                            <label class="invisible">Save</label>
                            <button type="submit" class="form-btn iconLabelBtn" style="width: 150px;">
                                <img src="./assets/addUser.svg" alt="">Add User
                            </button>
                        </div>
                </form>
                <div id="feedback_addUser" class="feedback_text"></div>

                <div class="password-requirement">
                    <div id="req-required">• Password is required for new user</div>
                    <div id="req-length">• Password must be at least 10 characters long</div>
                    <div id="req-uppercase">• Password must contain at least one uppercase letter</div>
                    <div id="req-number">• Password must contain at least one number</div>
                    <div id="req-special">• Password must contain at least one special character</div>
                </div>
            </div>

        </section>


        <section class="era-table-card mb destop-table" aria-labelledby="user-tbl-title">
            <!-- Table -->
            <div class="era-table-wrap">
                <table class="era-table" role="table" aria-label="users table">
                    <thead>
                        <tr>
                            <th class="era-num">#</th>
                            <th>Username</th>
                            <th>Id</th>
                            <th style="text-align: left;">Active</th>
                            <th style="text-align: left;">Role</th>
                            <th style="text-align: left;">Last Login</th>
                            <th class="era-email">Created at</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="user_list">
                    </tbody>
                </table>
            </div>
        </section>
        <div class="subs-list mb">
            <div class="menu-bar">
                <h2 id="user-mobile-tbl-title" class="era-table-title">All Users</h2>
            </div>
            <div id="user-list">
            </div>
        </div>


    </main>

    <?php foreach (\Digimium\Core\Assets::tagsFor('user.js') as $src): ?>
        <script src="<?= htmlspecialchars($src, ENT_QUOTES) ?>"></script>
    <?php endforeach; ?>

</body>

</html>

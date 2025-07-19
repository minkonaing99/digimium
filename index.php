<?php
session_start();

// Restore session from cookie if needed
if (!isset($_SESSION['username']) && isset($_COOKIE['username'])) {
    $_SESSION['username'] = $_COOKIE['username'];
    $_SESSION['privilege'] = $_COOKIE['privilege'];
    $_SESSION['logincode'] = $_COOKIE['logincode'];
}

// If session exists, redirect to home
if (isset($_SESSION['username']) && isset($_SESSION['logincode'])) {
    header("Location: home.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Full Screen Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
    <style>
        .modal-dialog {
            max-width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }

        .modal-content {
            height: 100vh;
            border-radius: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-box {
            width: 100%;
            max-width: 400px;
        }
    </style>
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <!-- Fullscreen Login Modal -->
    <div class="modal fade show" id="loginModal" tabindex="-1" role="dialog" style="display: block;" aria-modal="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">

                <form id="loginForm" class="login-box p-4 bg-light shadow">
                    <h3 class="text-center mb-4">Login</h3>

                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" class="form-control" id="username" name="username" required autofocus>
                    </div>

                    <div class="form-group mt-3">
                        <label for="password">Password</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                    </div>

                    <button type="submit" class="contact-btn menu-btn mt-3 d-block mx-auto">Login</button>
                </form>

            </div>
        </div>
    </div>

    <!-- Bootstrap Bundle JS (with Popper) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-ndDqU0Gzau9qJ1lfW4pNLlhNTkCfHzAVBReH9diLvGRem5+R9g2FzA8ZGN954O5Q"
        crossorigin="anonymous"></script>

    <!-- JS: Login form handler -->
    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const form = e.target;
            const formData = new FormData(form);

            try {
                const response = await fetch('./api/login.php', {
                    method: 'POST',
                    body: formData
                });

                const text = await response.text();

                if (text.trim() === 'success') {
                    window.location.href = 'home.php';
                } else {
                    alert(text); // Show server error message
                }

            } catch (err) {
                alert('Error occurred: ' + err.message);
            }
        });
    </script>
</body>

</html>
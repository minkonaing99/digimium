<?php
session_start();

// Check if session is empty
if (empty($_SESSION)) {
    echo "No session data found.";
} else {
    echo "<h2>Session Data:</h2>";
    echo "<pre>";
    print_r($_SESSION);
    echo "</pre>";
}

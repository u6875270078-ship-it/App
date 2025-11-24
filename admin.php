<?php
require_once 'config.php';

// Check authentication
if (!isset($_SESSION['admin_logged_in'])) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
        if ($_POST['password'] === ADMIN_PASSWORD) {
            $_SESSION['admin_logged_in'] = true;
            header('Location: admin.php');
            exit;
        } else {
            $loginError = 'Invalid password';
        }
    } else {
        // Show login form
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Login</title>
            <link rel="stylesheet" href="style.css">
            <style>
                .login-container {
                    max-width: 400px;
                    width: 100%;
                }
                .login-container .card {
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>Admin Panel</h1>
                </header>
                <div class="login-container">
                    <div class="card">
                        <h2>Login Required</h2>
                        <p class="subtitle">Enter your admin password</p>
                        
                        <form method="POST">
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" id="password" name="password" required autofocus>
                            </div>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </form>
                        
                        <?php if (isset($loginError)): ?>
                            <div class="error-message" style="display: block;">
                                <p><?php echo htmlspecialchars($loginError); ?></p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// Fetch statistics
$stats = [
    'total_visitors' => 0,
    'total_transactions' => 0,
    'verified_transactions' => 0,
    'pending_transactions' => 0
];

$result = $db->query("SELECT COUNT(*) as count FROM visitor_logs");
if ($result) {
    $row = $result->fetch_assoc();
    $stats['total_visitors'] = $row['count'];
}

$result = $db->query("SELECT COUNT(*) as count FROM transactions");
if ($result) {
    $row = $result->fetch_assoc();
    $stats['total_transactions'] = $row['count'];
}

$result = $db->query("SELECT COUNT(*) as count FROM transactions WHERE status = 'verified'");
if ($result) {
    $row = $result->fetch_assoc();
    $stats['verified_transactions'] = $row['count'];
}

$result = $db->query("SELECT COUNT(*) as count FROM transactions WHERE status = 'pending'");
if ($result) {
    $row = $result->fetch_assoc();
    $stats['pending_transactions'] = $row['count'];
}

// Fetch recent transactions
$transactions = [];
$result = $db->query("SELECT id, cardholder_name, email, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 20");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }
}

// Fetch recent visitor logs
$logs = [];
$result = $db->query("SELECT ip_address, action, data, timestamp FROM visitor_logs ORDER BY timestamp DESC LIMIT 30");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Payment Verification</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .admin-container {
            max-width: 1200px;
        }

        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 15px;
        }

        .admin-header h2 {
            margin: 0;
        }

        .logout-btn {
            background-color: #dc3545;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
        }

        .logout-btn:hover {
            background-color: #c82333;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
        }

        .stat-card .number {
            font-size: 32px;
            font-weight: 700;
            color: #0070f3;
        }

        .table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            margin-bottom: 30px;
        }

        .table-header {
            background-color: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #dee2e6;
        }

        .table-header h3 {
            margin: 0;
            font-size: 16px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background-color: #f8f9fa;
            padding: 12px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #666;
            text-transform: uppercase;
            border-bottom: 1px solid #dee2e6;
        }

        td {
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
            font-size: 14px;
        }

        tr:hover {
            background-color: #f8f9fa;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .status-verified {
            background-color: #d4edda;
            color: #155724;
        }

        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-failed {
            background-color: #f8d7da;
            color: #721c24;
        }

        .data-cell {
            font-size: 12px;
            color: #666;
            max-width: 300px;
            word-break: break-word;
        }

        .no-data {
            padding: 40px;
            text-align: center;
            color: #999;
        }
    </style>
</head>
<body style="background-color: #f5f7fa;">
    <div class="container admin-container">
        <header style="margin-bottom: 40px;">
            <div class="admin-header">
                <h2 style="color: white;">Admin Dashboard</h2>
                <a href="?logout=1" class="logout-btn">Logout</a>
            </div>
        </header>

        <main>
            <!-- Statistics -->
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Visitors</h3>
                    <div class="number"><?php echo $stats['total_visitors']; ?></div>
                </div>
                <div class="stat-card">
                    <h3>Total Transactions</h3>
                    <div class="number"><?php echo $stats['total_transactions']; ?></div>
                </div>
                <div class="stat-card">
                    <h3>Verified</h3>
                    <div class="number"><?php echo $stats['verified_transactions']; ?></div>
                </div>
                <div class="stat-card">
                    <h3>Pending</h3>
                    <div class="number"><?php echo $stats['pending_transactions']; ?></div>
                </div>
            </div>

            <!-- Transactions Table -->
            <div class="table-container">
                <div class="table-header">
                    <h3>Recent Transactions</h3>
                </div>
                <?php if (!empty($transactions)): ?>
                    <table>
                        <thead>
                            <tr>
                                <th>Cardholder</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($transactions as $tx): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($tx['cardholder_name']); ?></td>
                                    <td><?php echo htmlspecialchars($tx['email']); ?></td>
                                    <td>
                                        <span class="status-badge status-<?php echo $tx['status']; ?>">
                                            <?php echo ucfirst($tx['status']); ?>
                                        </span>
                                    </td>
                                    <td><?php echo date('M d, Y H:i', strtotime($tx['created_at'])); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <div class="no-data">No transactions yet</div>
                <?php endif; ?>
            </div>

            <!-- Visitor Logs Table -->
            <div class="table-container">
                <div class="table-header">
                    <h3>Visitor Activity Log</h3>
                </div>
                <?php if (!empty($logs)): ?>
                    <table>
                        <thead>
                            <tr>
                                <th>IP Address</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($logs as $log): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($log['ip_address']); ?></td>
                                    <td><?php echo htmlspecialchars($log['action']); ?></td>
                                    <td class="data-cell">
                                        <?php 
                                        $data = json_decode($log['data'], true);
                                        if (!empty($data)) {
                                            echo htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                                        } else {
                                            echo '-';
                                        }
                                        ?>
                                    </td>
                                    <td><?php echo date('M d, H:i:s', strtotime($log['timestamp'])); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <div class="no-data">No visitor logs yet</div>
                <?php endif; ?>
            </div>
        </main>
    </div>
</body>
</html>

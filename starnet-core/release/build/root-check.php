<?php
header('Content-Type: text/plain; charset=utf-8');
echo "PHP OK\n";
echo 'FILE=' . __FILE__ . "\n";
echo 'DOCUMENT_ROOT=' . ($_SERVER['DOCUMENT_ROOT'] ?? '-') . "\n";
echo "Next: install.php\n";

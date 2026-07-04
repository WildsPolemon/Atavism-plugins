<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', static fn () => 'StarNet Core API v1');

$routes->group('api', ['filter' => 'apcors'], static function ($routes) {
    $routes->post('auth/login', 'Api\AuthController::login');
    $routes->get('auth/me', 'Api\AuthController::me', ['filter' => 'apiauth']);

    $routes->get('barcode/(:segment)', 'Api\BarcodeController::show/$1', ['filter' => 'apiauth']);

    $routes->group('', ['filter' => 'apiauth'], static function ($routes) {
        $routes->get('dashboard/overview', 'Api\DashboardController::overview');
        $routes->get('dashboard/sales-chart', 'Api\DashboardController::salesChart');

        $routes->get('products/categories', 'Api\ProductController::categories');
        $routes->post('products/categories', 'Api\ProductController::createCategory');
        $routes->get('products', 'Api\ProductController::index');
        $routes->post('products', 'Api\ProductController::create');
        $routes->patch('products/(:num)', 'Api\ProductController::update/$1');

        $routes->get('pos/shift', 'Api\PosController::shift');
        $routes->post('pos/shift/open', 'Api\PosController::openShiftAction');
        $routes->post('pos/shift/close', 'Api\PosController::closeShiftAction');
        $routes->get('pos/search', 'Api\PosController::search');
        $routes->get('pos/sales', 'Api\PosController::sales');
        $routes->get('pos/sales/held', 'Api\PosController::heldSales');
        $routes->post('pos/sale', 'Api\PosController::sale');
        $routes->post('pos/sales/(:num)/return', 'Api\PosController::returnSale/$1');
        $routes->get('pos/xz-report', 'Api\PosController::xzReport');

        $routes->get('warehouse/stock', 'Api\WarehouseController::stock');
        $routes->get('warehouse/warehouses', 'Api\WarehouseController::warehouses');
        $routes->post('warehouse/operations', 'Api\WarehouseController::createOperation');

        $routes->get('suppliers', 'Api\SupplierController::index');
        $routes->post('suppliers', 'Api\SupplierController::create');
        $routes->get('suppliers/stats', 'Api\SupplierController::stats');

        $routes->get('stores', 'Api\StoreController::index');
        $routes->post('stores', 'Api\StoreController::create');

        $routes->get('crm/customers', 'Api\CrmController::customers');
        $routes->post('crm/customers', 'Api\CrmController::createCustomer');
        $routes->get('crm/customers/(:num)', 'Api\CrmController::show/$1');

        $routes->get('reports/sales', 'Api\ReportController::sales');
        $routes->get('reports/finance', 'Api\ReportController::finance');
        $routes->get('reports/profit', 'Api\ReportController::profit');
        $routes->get('reports/employees', 'Api\ReportController::employees');
        $routes->get('reports/top-products', 'Api\ReportController::topProducts');
        $routes->delete('pos/sales/(:num)/held', 'Api\PosController::cancelHeld/$1');
    });
});

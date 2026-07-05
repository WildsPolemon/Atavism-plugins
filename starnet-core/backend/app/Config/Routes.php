<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', static fn () => 'StarNet Core API v1');

$routes->group('api', ['filter' => 'apcors'], static function ($routes) {
    $routes->post('auth/login', 'Api\AuthController::login');
    $routes->get('auth/me', 'Api\AuthController::me', ['filter' => 'apiauth']);

    $routes->get('estore/catalog', 'Api\EstoreController::catalog');
    $routes->post('estore/order', 'Api\EstoreController::order');
    $routes->get('pos/receipt-settings', 'Api\PosController::receiptSettings');

    $routes->get('barcode/(:segment)', 'Api\BarcodeController::show/$1', ['filter' => 'apiauth']);

    $routes->group('', ['filter' => 'apiauth'], static function ($routes) {
        $routes->get('dashboard/overview', 'Api\DashboardController::overview');
        $routes->get('dashboard/sales-chart', 'Api\DashboardController::salesChart');

        $routes->get('settings', 'Api\SettingsController::index');
        $routes->put('settings', 'Api\SettingsController::update');

        $routes->get('products/categories', 'Api\ProductController::categories');
        $routes->post('products/categories', 'Api\ProductController::createCategory');
        $routes->patch('products/categories/(:num)', 'Api\ProductController::updateCategory/$1');
        $routes->delete('products/categories/(:num)', 'Api\ProductController::deleteCategory/$1');
        $routes->get('products', 'Api\ProductController::index');
        $routes->get('products/next-code', 'Api\ProductController::nextCode');
        $routes->post('products', 'Api\ProductController::create');
        $routes->patch('products/(:num)', 'Api\ProductController::update/$1');
        $routes->post('products/(:num)/barcode', 'Api\ProductController::generateBarcode/$1');

        $routes->get('export/products', 'Api\ExportController::products');
        $routes->get('export/customers', 'Api\ExportController::customers');
        $routes->post('import/products', 'Api\ExportController::importProducts');

        $routes->get('pos/shift', 'Api\PosController::shift');
        $routes->post('pos/shift/open', 'Api\PosController::openShiftAction');
        $routes->post('pos/shift/close', 'Api\PosController::closeShiftAction');
        $routes->get('pos/products', 'Api\PosController::products');
        $routes->get('pos/search', 'Api\PosController::search');
        $routes->get('pos/recommendations', 'Api\PosController::recommendations');
        $routes->post('pos/products', 'Api\ProductController::create');
        $routes->get('pos/sales', 'Api\PosController::sales');
        $routes->get('pos/sales/held', 'Api\PosController::heldSales');
        $routes->get('pos/sales/(:num)', 'Api\PosController::saleDetail/$1');
        $routes->post('pos/sale', 'Api\PosController::sale');
        $routes->post('pos/sales/(:num)/return', 'Api\PosController::returnSale/$1');
        $routes->get('pos/xz-report', 'Api\PosController::xzReport');
        $routes->get('pos/shifts', 'Api\ShiftController::index');
        $routes->get('pos/shifts/(:num)/xz-report', 'Api\ShiftController::xzReport/$1');
        $routes->get('pos/shifts/(:num)', 'Api\ShiftController::show/$1');
        $routes->get('pos/my-registers', 'Api\ShiftController::myRegisters');
        $routes->get('pos/registers', 'Api\ShiftController::registers');
        $routes->get('pos/registers/(:num)', 'Api\ShiftController::showRegister/$1');
        $routes->post('pos/registers', 'Api\ShiftController::createRegister');
        $routes->patch('pos/registers/(:num)', 'Api\ShiftController::updateRegister/$1');
        $routes->get('pos/users', 'Api\ShiftController::users');
        $routes->delete('pos/sales/(:num)/held', 'Api\PosController::cancelHeld/$1');

        $routes->get('finance/accounts', 'Api\MoneyMovementController::accounts');
        $routes->post('finance/accounts', 'Api\MoneyMovementController::createAccount');
        $routes->get('money-movements', 'Api\MoneyMovementController::index');
        $routes->post('money-movements', 'Api\MoneyMovementController::create');

        $routes->get('warehouse/stock', 'Api\WarehouseController::stock');
        $routes->get('warehouse/warehouses', 'Api\WarehouseController::warehouses');
        $routes->get('warehouse/operations', 'Api\WarehouseController::operations');
        $routes->post('warehouse/operations', 'Api\WarehouseController::createOperation');
        $routes->get('warehouse/report', 'Api\WarehouseController::report');

        $routes->get('purchases', 'Api\PurchaseController::index');
        $routes->post('purchases', 'Api\PurchaseController::create');
        $routes->post('purchases/(:num)/receive', 'Api\PurchaseController::receive/$1');

        $routes->get('inventory', 'Api\InventoryController::index');
        $routes->post('inventory', 'Api\InventoryController::create');
        $routes->get('inventory/(:num)', 'Api\InventoryController::show/$1');
        $routes->patch('inventory/(:num)/items/(:num)', 'Api\InventoryController::updateItem/$1/$2');
        $routes->post('inventory/(:num)/complete', 'Api\InventoryController::complete/$1');

        $routes->get('suppliers', 'Api\SupplierController::index');
        $routes->post('suppliers', 'Api\SupplierController::create');
        $routes->get('suppliers/stats', 'Api\SupplierController::stats');

        $routes->get('stores', 'Api\StoreController::index');
        $routes->post('stores', 'Api\StoreController::create');

        $routes->get('crm/customers', 'Api\CrmController::customers');
        $routes->post('crm/customers', 'Api\CrmController::createCustomer');
        $routes->get('crm/customers/(:num)', 'Api\CrmController::show/$1');
        $routes->patch('crm/customers/(:num)', 'Api\CrmController::updateCustomer/$1');
        $routes->post('crm/customers/(:num)/debt-payment', 'Api\CrmController::debtPayment/$1');
        $routes->get('crm/customers/debtors', 'Api\CrmController::debtors');

        $routes->get('reports/sales', 'Api\ReportController::sales');
        $routes->get('reports/finance', 'Api\ReportController::finance');
        $routes->get('reports/profit', 'Api\ReportController::profit');
        $routes->get('reports/employees', 'Api\ReportController::employees');
        $routes->get('reports/top-products', 'Api\ReportController::topProducts');

        $routes->get('estore/orders', 'Api\EstoreController::orders');
        $routes->patch('estore/orders/(:num)', 'Api\EstoreController::updateOrderStatus/$1');

        $routes->get('prro/status', 'Api\PrroController::status');
        $routes->get('prro/shift', 'Api\PrroController::shiftStatus');
        $routes->post('prro/test', 'Api\PrroController::test');
        $routes->post('prro/fiscalize/(:num)', 'Api\PrroController::fiscalize/$1');
        $routes->get('prro/receipt/(:num)/png', 'Api\PrroController::receiptPng/$1');
    });
});

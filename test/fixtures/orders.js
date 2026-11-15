// Hand-transcribed source records. No filesystem or application-store access.
var products = [
  { id: 1, sku: 'GRN-001', name: 'Indrayani Basmati Rice 5kg', category: 'Staples & Grains', unit: 'bag', hsn: '1006', price: 640, stock: 18, reserved: 2, reorderLevel: 10 },
  { id: 2, sku: 'GRN-002', name: 'Unpolished Toor Dal 1kg', category: 'Staples & Grains', unit: 'pkt', hsn: '0713', price: 165, stock: 28, reserved: 0, reorderLevel: 15 },
  { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', category: 'Oils & Spices', unit: 'btl', hsn: '1512', price: 190, stock: 22, reserved: 4, reorderLevel: 12 },
  { id: 5, sku: 'OIL-002', name: 'Cold-Pressed Groundnut Oil 5L', category: 'Oils & Spices', unit: 'jar', hsn: '1508', price: 1120, stock: 9, reserved: 1, reorderLevel: 8 },
  { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', category: 'Dairy & Ghee', unit: 'jar', hsn: '0405', price: 450, stock: 1, reserved: 0, reorderLevel: 5 },
  { id: 7, sku: 'DRY-002', name: 'Pasteurized Table Butter 500g', category: 'Dairy & Ghee', unit: 'box', hsn: '0405', price: 260, stock: 24, reserved: 0, reorderLevel: 10 },
  { id: 8, sku: 'BEV-001', name: 'Assam CTC Masala Chai 250g', category: 'Beverages & Packaged', unit: 'pkt', hsn: '0902', price: 140, stock: 42, reserved: 0, reorderLevel: 15 },
  { id: 9, sku: 'BEV-002', name: 'Filter Coffee Decoction Blend 500g', category: 'Beverages & Packaged', unit: 'pkt', hsn: '0901', price: 310, stock: 15, reserved: 0, reorderLevel: 8 },
  { id: 12, sku: 'BEV-003', name: 'Kokum Sherbet Concentrate 750ml', category: 'Beverages & Packaged', unit: 'btl', hsn: '2106', price: 180, stock: 14, reserved: 0, reorderLevel: 6 }
];

function item(id, qty) {
  var p = products.find(function (product) { return product.id === id; });
  return { id: p.id, sku: p.sku, name: p.name, hsn: p.hsn, price: p.price, qty: qty };
}

var orders = [
  { id: 1001, date: '28/12/2021', customer: 'Meera Joshi', customerId: 1, paymentMode: 'khata', status: 'completed', items: [item(8, 2), item(2, 2)], coupon: '', subtotal: 610, discount: 0, tax: 66.9, total: 676.9 },
  { id: 1002, date: '05/01/2022', customer: 'Anil Kulkarni', customerId: 2, paymentMode: 'upi', status: 'completed', items: [item(1, 1), item(4, 2)], coupon: 'SAVE10', subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 },
  { id: 1003, date: '14/01/2022', customer: 'Walk-in', customerId: null, paymentMode: 'cash', status: 'completed', items: [item(7, 1), item(8, 1)], coupon: 'FLAT50', subtotal: 400, discount: 50, tax: 49.35, total: 399.35 },
  { id: 1004, date: '30/01/2022', customer: 'Kalyani Foods (Wholesale)', customerId: 5, paymentMode: 'khata', status: 'completed', items: [item(5, 2)], coupon: 'SAVE10', subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 },
  { id: 1005, date: '02/02/2022', customer: 'Priya Nair', customerId: 3, paymentMode: 'upi', status: 'completed', items: [item(1, 1), item(12, 2)], coupon: 'FLAT50', subtotal: 1000, discount: 50, tax: 91.96, total: 1041.96 },
  { id: 1006, date: '18/02/2022', customer: 'Meera Joshi', customerId: 1, paymentMode: 'khata', status: 'completed', items: [item(6, 2), item(9, 1)], coupon: 'WELCOME', subtotal: 1210, discount: 60.5, tax: 155.61, total: 1305.11 },
  { id: 1007, date: '04/03/2022', customer: 'Suresh Deshmukh', customerId: 4, paymentMode: 'khata', status: 'pending', items: [item(6, 2), item(4, 2)], coupon: '', subtotal: 1280, discount: 0, tax: 127, total: 1407 },
  { id: 1008, date: '15/03/2022', customer: 'Walk-in', customerId: null, paymentMode: 'cash', status: 'completed', items: [item(8, 1), item(12, 2)], coupon: '', subtotal: 500, discount: 0, tax: 90, total: 590 }
];

exports.products = products;
exports.orders = orders;

const fs = require('fs');
const path = require('path');

const LINKS_FILE = path.join(__dirname, 'links.txt');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

async function importShopee() {
    console.log('🚀 Bắt đầu quá trình import sản phẩm từ links.txt...');

    if (!fs.existsSync(LINKS_FILE)) {
        console.log('❌ Không tìm thấy file links.txt');
        return;
    }

    const content = fs.readFileSync(LINKS_FILE, 'utf8');
    const urls = content.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    if (urls.length === 0) {
        console.log('ℹ️ links.txt trống. Không có gì để xử lý.');
        return;
    }

    let currentProducts = [];
    if (fs.existsSync(PRODUCTS_FILE)) {
        currentProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    }

    for (const url of urls) {
        try {
            console.log(`📡 Đang lấy dữ liệu cho: ${url}`);
            const apiUrl = `https://data.addlivetag.com/product-data/product-data.php?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.imageUrl) {
                currentProducts.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    title: data.title || "Sản phẩm mới từ Shopee",
                    image: data.imageUrl,
                    category: "Shopee Import",
                    brand: "Shopee",
                    oldPrice: 0,
                    newPrice: 0,
                    sold: 0,
                    stockPercent: 100,
                    affiliateUrl: url,
                    isHot: false
                });
            }
        } catch (error) {
            console.error(`❌ Lỗi xử lý link ${url}:`, error.message);
        }
    }

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(currentProducts, null, 2), 'utf8');
    fs.writeFileSync(LINKS_FILE, '', 'utf8'); // Xóa link sau khi đã xử lý xong
    console.log('✅ Hoàn tất! Đã cập nhật products.json và làm trống links.txt');
}

importShopee();

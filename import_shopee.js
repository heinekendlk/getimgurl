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
    // Hỗ trợ cả xuống dòng của Windows (\r\n) và Linux (\n)
    const urls = content.split(/\r?\n/).map(u => u.trim()).filter(u => u.length > 0);

    if (urls.length === 0) {
        console.log('ℹ️ links.txt trống. Không có gì để xử lý.');
        return;
    }

    let currentProducts = [];
    if (fs.existsSync(PRODUCTS_FILE)) {
        try {
            const rawData = fs.readFileSync(PRODUCTS_FILE, 'utf8').trim();
            currentProducts = rawData ? JSON.parse(rawData) : [];
        } catch (e) {
            console.error('⚠️ Lỗi đọc products.json cũ, sẽ khởi tạo danh sách mới:', e.message);
            currentProducts = [];
        }
    }

    let addedCount = 0;
    for (const url of urls) {
        try {
            console.log(`📡 Đang lấy dữ liệu cho: ${url}`);
            const apiUrl = `https://data.addlivetag.com/product-data/product-data.php?url=${encodeURIComponent(url)}`;
            
            // Thêm User-Agent để tránh bị API chặn request từ server
            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                console.error(`❌ API trả về lỗi ${response.status} cho link: ${url}`);
                continue;
            }

            const data = await response.json();

            if (data && data.imageUrl) {
                currentProducts.push({
                    id: Date.now() + Math.floor(Math.random() * 10000),
                    title: data.title || "Sản phẩm mới từ Shopee",
                    image: data.imageUrl,
                    category: "Shopee Import",
                    brand: "Shopee",
                    oldPrice: parseInt(data.oldPrice) || 0,
                    newPrice: parseInt(data.price) || 0,
                    sold: 0,
                    stockPercent: 100,
                    affiliateUrl: url,
                    isHot: false
                });
                addedCount++;
                console.log(`✅ Đã thêm: ${data.title}`);
            } else {
                console.log(`⚠️ API không trả về imageUrl cho link này. Có thể link sai hoặc API lỗi.`);
            }
        } catch (error) {
            console.error(`❌ Lỗi xử lý link ${url}:`, error.message);
        }
    }

    if (addedCount > 0) {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(currentProducts, null, 2), 'utf8');
        fs.writeFileSync(LINKS_FILE, '', 'utf8'); // Chỉ làm sạch links.txt nếu có ít nhất 1 sp thành công
        console.log(`✅ Thành công! Đã thêm ${addedCount} sản phẩm mới.`);
    } else {
        console.log('ℹ️ Không có sản phẩm nào được thêm vào. File products.json giữ nguyên.');
    }
}

importShopee();

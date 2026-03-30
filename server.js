const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.')); // Phục vụ các file tĩnh (html, js, json)

const PRODUCTS_FILE = path.join(__dirname, 'products.json');

app.post('/api/process-links', async (req, res) => {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: 'Danh sách link không hợp lệ' });
    }

    const addedProducts = [];
    
    // Đọc dữ liệu cũ
    let currentProducts = [];
    if (fs.existsSync(PRODUCTS_FILE)) {
        try {
            currentProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
        } catch (e) {
            currentProducts = [];
        }
    }

    for (const url of urls) {
        if (!url.trim()) continue;
        
        try {
            const apiUrl = `https://data.addlivetag.com/product-data/product-data.php?url=${encodeURIComponent(url.trim())}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.imageUrl) {
                const newProduct = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    title: data.title || "Sản phẩm mới", // Giả sử API trả về title, nếu không để mặc định
                    image: data.imageUrl,
                    category: "Shopee Import",
                    brand: "Shopee",
                    oldPrice: 0,
                    newPrice: 0,
                    sold: 0,
                    stockPercent: 100,
                    affiliateUrl: url.trim(),
                    isHot: false
                };
                addedProducts.push(newProduct);
                currentProducts.push(newProduct);
            }
        } catch (error) {
            console.error(`Lỗi khi xử lý link: ${url}`, error.message);
        }
    }

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(currentProducts, null, 2), 'utf8');
    res.json({ success: true, data: addedProducts });
});

app.listen(PORT, () => console.log(`🚀 Server admin đang chạy tại http://localhost:${PORT}/admin.html`));

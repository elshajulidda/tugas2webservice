const API_BASE = 'http://localhost/inventory-app/backend/api';

class InventoryApp {
    constructor() {
        this.currentItem = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadItems();
    }

    bindEvents() {
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelEdit());
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchItems(e.target.value));
        document.getElementById('image').addEventListener('change', (e) => this.previewImage(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validasi form
        if (!this.validateForm()) {
            return;
        }

        const formData = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim(),
            quantity: parseInt(document.getElementById('quantity').value),
            price: parseFloat(document.getElementById('price').value) || 0
        };

        const imageFile = document.getElementById('image').files[0];

        try {
            // Disable submit button
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Menyimpan...';

            let imageFilename = '';
            
            // Upload image if exists
            if (imageFile) {
                const uploadResult = await this.uploadImage(imageFile);
                if (uploadResult.filename) {
                    imageFilename = uploadResult.filename;
                    formData.image = imageFilename;
                }
            }

            if (this.currentItem) {
                // Update existing item
                await this.updateItem(this.currentItem.id, formData);
                this.showMessage('Barang berhasil diperbarui!', 'success');
            } else {
                // Create new item
                await this.createItem(formData);
                this.showMessage('Barang berhasil ditambahkan!', 'success');
            }

            this.resetForm();
            this.loadItems();
        } catch (error) {
            this.showMessage('Terjadi kesalahan: ' + error.message, 'error');
        } finally {
            // Re-enable submit button
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.textContent = this.currentItem ? 'Update Barang' : 'Tambah Barang';
        }
    }

    validateForm() {
        const name = document.getElementById('name').value.trim();
        const quantity = document.getElementById('quantity').value;

        if (!name) {
            this.showMessage('Nama barang harus diisi!', 'error');
            document.getElementById('name').focus();
            return false;
        }

        if (!quantity || quantity < 0) {
            this.showMessage('Jumlah barang harus diisi dan tidak boleh negatif!', 'error');
            document.getElementById('quantity').focus();
            return false;
        }

        return true;
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal mengupload gambar');
        }

        return await response.json();
    }

    async createItem(itemData) {
        const response = await fetch(`${API_BASE}/items.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal menambahkan barang');
        }

        return await response.json();
    }

    async updateItem(id, itemData) {
        const response = await fetch(`${API_BASE}/items.php?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal memperbarui barang');
        }

        return await response.json();
    }

    async deleteItem(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/items.php?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menghapus barang');
            }

            this.showMessage('Barang berhasil dihapus!', 'success');
            this.loadItems();
        } catch (error) {
            this.showMessage('Terjadi kesalahan: ' + error.message, 'error');
        }
    }

    async loadItems() {
        const loading = document.getElementById('loading');
        const itemsList = document.getElementById('itemsList');
        
        loading.style.display = 'block';
        itemsList.innerHTML = '';

        try {
            const response = await fetch(`${API_BASE}/items.php`);
            
            if (!response.ok) {
                throw new Error('Gagal memuat data dari server');
            }
            
            const items = await response.json();

            if (items.length === 0) {
                itemsList.innerHTML = '<div class="no-items">Tidak ada barang dalam inventaris.</div>';
                return;
            }

            items.forEach((item, index) => {
                const itemCard = this.createItemCard(item);
                // Stagger animation
                itemCard.style.animationDelay = `${index * 0.1}s`;
                itemsList.appendChild(itemCard);
            });
        } catch (error) {
            itemsList.innerHTML = '<div class="error">Gagal memuat data barang: ' + error.message + '</div>';
        } finally {
            loading.style.display = 'none';
        }
    }

    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        const imageUrl = item.image ? 
            `http://localhost/inventory-app/backend/uploads/${item.image}` : 
            'https://via.placeholder.com/100x80/ecf0f1/95a5a6?text=No+Image';

        card.innerHTML = `
            <div class="item-header">
                <div class="item-name">${this.escapeHtml(item.name)}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="app.editItem(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="app.deleteItem(${item.id})">Hapus</button>
                </div>
            </div>
            <div class="item-details">
                <div class="item-info">
                    ${item.description ? `<div class="item-description">${this.escapeHtml(item.description)}</div>` : ''}
                    <div class="item-meta">
                        <span class="quantity">Stok: ${item.quantity}</span>
                        ${item.price > 0 ? `<span class="price">Harga: Rp ${item.price.toLocaleString('id-ID')}</span>` : ''}
                        <span class="date">Ditambah: ${new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                </div>
                <div class="item-image">
                    <img src="${imageUrl}" alt="${this.escapeHtml(item.name)}" 
                         onerror="this.src='https://via.placeholder.com/100x80/ecf0f1/95a5a6?text=No+Image'">
                </div>
            </div>
        `;

        return card;
    }

    async editItem(id) {
        try {
            const response = await fetch(`${API_BASE}/items.php?id=${id}`);
            
            if (!response.ok) {
                throw new Error('Gagal memuat data barang');
            }
            
            const item = await response.json();

            this.currentItem = item;
            
            document.getElementById('itemId').value = item.id;
            document.getElementById('name').value = item.name;
            document.getElementById('description').value = item.description || '';
            document.getElementById('quantity').value = item.quantity;
            document.getElementById('price').value = item.price || '';
            
            document.getElementById('form-title').textContent = 'Edit Barang';
            document.getElementById('submitBtn').textContent = 'Update Barang';
            document.getElementById('cancelBtn').style.display = 'inline-block';

            // Show existing image if available
            const imagePreview = document.getElementById('imagePreview');
            if (item.image) {
                const imageUrl = `http://localhost/inventory-app/backend/uploads/${item.image}`;
                imagePreview.innerHTML = `<img src="${imageUrl}" alt="${this.escapeHtml(item.name)}">`;
            } else {
                imagePreview.innerHTML = '';
            }

            // Scroll to form
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            this.showMessage('Gagal memuat data barang: ' + error.message, 'error');
        }
    }

    cancelEdit() {
        this.currentItem = null;
        this.resetForm();
    }

    resetForm() {
        document.getElementById('itemForm').reset();
        document.getElementById('itemId').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        
        document.getElementById('form-title').textContent = 'Tambah Barang Baru';
        document.getElementById('submitBtn').textContent = 'Tambah Barang';
        document.getElementById('cancelBtn').style.display = 'none';
        
        this.currentItem = null;
    }

    previewImage(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        
        preview.innerHTML = '';
        
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                this.showMessage('Hanya file gambar (JPG, PNG, GIF, WebP) yang diizinkan!', 'error');
                e.target.value = '';
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                this.showMessage('Ukuran file maksimal 5MB!', 'error');
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            }
            reader.readAsDataURL(file);
        }
    }

    async searchItems(query) {
        const itemsList = document.getElementById('itemsList');
        const items = itemsList.getElementsByClassName('item-card');
        
        for (let item of items) {
            const itemName = item.querySelector('.item-name').textContent.toLowerCase();
            const itemDescription = item.querySelector('.item-description')?.textContent.toLowerCase() || '';
            
            if (itemName.includes(query.toLowerCase()) || itemDescription.includes(query.toLowerCase())) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InventoryApp();
});
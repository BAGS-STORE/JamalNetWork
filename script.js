(function() {
    'use strict';
    
    // ===== كشف الأجهزة البطيئة =====
    function isSlowDevice() {
        // كشف اتصال 2G
        if (navigator.connection) {
            if (navigator.connection.saveData || navigator.connection.effectiveType === '2g') {
                return true;
            }
        }
        
        // كشف الأجهزة المحمولة القديمة
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const screenSize = window.innerWidth * window.innerHeight;
        
        return isMobile && screenSize < 600000; // أقل من شاشة HD
    }
    
    const IS_SLOW = isSlowDevice();
    
    // ===== Particles Animation (محسّن) =====
    const canvas = document.getElementById('particlesCanvas');
    let ctx = null;
    let particles = [];
    let animFrameId = null;
    let particlesLoaded = false;
    
    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height;
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.size = Math.random() * 2 + 0.5; // أصغر حجماً
            this.speedY = Math.random() * 0.3 + 0.1; // أبطأ
            this.speedX = (Math.random() - 0.5) * 0.15;
            this.opacity = Math.random() * 0.3 + 0.1;
            this.fadeSpeed = Math.random() * 0.002 + 0.001;
        }
        update() {
            this.y -= this.speedY;
            this.x += this.speedX;
            this.opacity -= this.fadeSpeed;
            if (this.opacity <= 0 || this.y < -10) {
                this.reset();
                this.y = canvas.height + 10;
                this.opacity = Math.random() * 0.3 + 0.1;
            }
            if (this.x < -10) this.x = canvas.width + 10;
            if (this.x > canvas.width + 10) this.x = -10;
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(160,210,255,${Math.max(0, this.opacity)})`;
            ctx.fill();
        }
    }
    
    function initParticles() {
        if (!canvas || IS_SLOW) return;
        
        ctx = canvas.getContext('2d');
        resizeCanvas();
        
        // تقليل عدد الجسيمات بشكل كبير للأجهزة البطيئة
        let count = 30;
        if (window.innerWidth < 768) count = 15;
        if (IS_SLOW) count = 8;
        
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }
    
    function animateParticles() {
        if (!ctx || !canvas || particles.length === 0) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });
        animFrameId = requestAnimationFrame(animateParticles);
    }
    
    function stopParticles() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }
    
    function startParticlesLazy() {
        if (particlesLoaded || IS_SLOW) return;
        
        particlesLoaded = true;
        if (canvas) {
            canvas.style.display = 'block';
            initParticles();
            animateParticles();
        }
    }
    
    // ===== Event Delegation (تحسين الأداء) =====
    function handleNavigation(viewName) {
        if (currentView === viewName) return;
        
        const views = {
            home: document.getElementById('view-home'),
            recharge: document.getElementById('view-recharge'),
            cards: document.getElementById('view-cards')
        };
        
        Object.values(views).forEach(v => {
            if (v) v.classList.remove('active');
        });
        
        if (views[viewName]) {
            views[viewName].classList.add('active');
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });
        
        currentView = viewName;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        clearAllErrors();
    }
    
    let currentView = 'home';
    
    // ===== Error Helpers =====
    function showError(elId, errId) {
        const el = document.getElementById(elId);
        const err = document.getElementById(errId);
        if (el) el.classList.add('error');
        if (err) err.classList.add('show');
    }
    
    function clearAllErrors() {
        document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
            el.classList.remove('error');
        });
        document.querySelectorAll('.error-msg.show').forEach(el => {
            el.classList.remove('show');
        });
    }
    
    // ===== Modal =====
    const modalOverlay = document.getElementById('modalOverlay');
    const modalDetails = document.getElementById('modalDetails');
    let pendingWhatsAppUrl = '';
    let pendingOrderData = null;
    
    function openModal(detailsHTML, whatsappUrl, orderData) {
        if (!modalDetails || !modalOverlay) return;
        
        modalDetails.innerHTML = detailsHTML;
        pendingWhatsAppUrl = whatsappUrl;
        pendingOrderData = orderData;
        modalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        if (!modalOverlay) return;
        
        modalOverlay.classList.remove('show');
        document.body.style.overflow = '';
        pendingWhatsAppUrl = '';
        pendingOrderData = null;
    }
    
    function confirmOrder() {
        if (pendingWhatsAppUrl) {
            window.open(pendingWhatsAppUrl, '_blank', 'noopener,noreferrer');
            closeModal();
            
            if (pendingOrderData) {
                if (pendingOrderData.formType === 'recharge') {
                    const elements = ['recharge-company', 'recharge-service-type', 'recharge-quantity', 'recharge-customer-name'];
                    elements.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
                    
                    const quantityLabel = document.getElementById('recharge-quantity-label');
                    const quantityInput = document.getElementById('recharge-quantity');
                    if (quantityLabel) quantityLabel.textContent = 'الكمية';
                    if (quantityInput) {
                        quantityInput.placeholder = 'أدخل الكمية المطلوبة';
                        quantityInput.type = 'text';
                    }
                } else if (pendingOrderData.formType === 'cards') {
                    const cardsNetwork = document.getElementById('cards-network');
                    const cardsCategory = document.getElementById('cards-category');
                    const cardsCount = document.getElementById('cards-count');
                    const cardsCustomerName = document.getElementById('cards-customer-name');
                    
                    if (cardsNetwork) cardsNetwork.value = '';
                    if (cardsCategory) cardsCategory.value = '';
                    if (cardsCount) cardsCount.value = '1';
                    if (cardsCustomerName) cardsCustomerName.value = '';
                }
                clearAllErrors();
            }
        }
    }
    
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    // ===== Submit Functions =====
    function submitRecharge() {
        clearAllErrors();
        let hasError = false;
        
        const company = document.getElementById('recharge-company')?.value.trim() || '';
        const serviceType = document.getElementById('recharge-service-type')?.value.trim() || '';
        const quantity = document.getElementById('recharge-quantity')?.value.trim() || '';
        const customerName = document.getElementById('recharge-customer-name')?.value.trim() || '';
        
        if (!company) { showError('recharge-company', 'err-recharge-company'); hasError = true; }
        if (!serviceType) { showError('recharge-service-type', 'err-recharge-service-type'); hasError = true; }
        if (!quantity) { showError('recharge-quantity', 'err-recharge-quantity'); hasError = true; }
        if (!customerName) { showError('recharge-customer-name', 'err-recharge-customer-name'); hasError = true; }
        
        if (hasError) {
            const firstError = document.querySelector('.form-input.error, .form-select.error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        const quantityLabelText = document.getElementById('recharge-quantity-label')?.textContent || 'الكمية';
        const message = `طلب شحن فوري\nشركة: ${company}\nنوع الخدمة: ${serviceType}\n${quantityLabelText}: ${quantity}\nاسم العميل: ${customerName}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/9671439930?text=${encodedMessage}`;
        const detailsHTML = `
            <div class="modal-detail-row"><span class="modal-detail-label">شركة الاتصالات</span><span class="modal-detail-value">${escapeHTML(company)}</span></div>
            <div class="modal-detail-row"><span class="modal-detail-label">نوع الخدمة</span><span class="modal-detail-value">${escapeHTML(serviceType)}</span></div>
            <div class="modal-detail-row"><span class="modal-detail-label">${escapeHTML(quantityLabelText)}</span><span class="modal-detail-value">${escapeHTML(quantity)}</span></div>
            <div class="modal-detail-row"><span class="modal-detail-label">اسم العميل</span><span class="modal-detail-value">${escapeHTML(customerName)}</span></div>
        `;
        openModal(detailsHTML, whatsappUrl, { formType: 'recharge' });
    }
    
    function submitCards() {
        clearAllErrors();
        let hasError = false;
        
        const network = document.getElementById('cards-network')?.value.trim() || '';
        const category = document.getElementById('cards-category')?.value.trim() || '';
        const count = document.getElementById('cards-count')?.value.trim() || '';
        const customerName = document.getElementById('cards-customer-name')?.value.trim() || '';
        
        if (!network) { showError('cards-network', 'err-cards-network'); hasError = true; }
        if (!category) { showError('cards-category', 'err-cards-category'); hasError = true; }
        if (!count || isNaN(count) || parseInt(count) < 1) { showError('cards-count', 'err-cards-count'); hasError = true; }
        if (!customerName) { showError('cards-customer-name', 'err-cards-customer-name'); hasError = true; }
        
        if (hasError) {
            const firstError = document.querySelector('.form-input.error, .form-select.error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        const message = `طلب كروت شبكات\nالشبكة: ${network}\nالفئة: ${category} ريال\nالعدد: ${count}\nاسم العميل: ${customerName}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/9671439930?text=${encodedMessage}`;
        const detailsHTML = `
            <div class="modal-detail-row"><span class="modal-detail-label">نوع الشبكة</span><span class="modal-detail-value">${escapeHTML(network)}</span></div>
            <div class="modal-detail-row"><span class="modal-detail-label">فئة الكرت</span><span class="modal-detail-value">${escapeHTML(category)} ريال</span></div>
            <div class="modal-detail-row"><span class="modal-detail-label">عدد الكروت</span><span class="modal-detail-value">${escapeHTML(count)}</span></div>
            <div class="modal-detail-row"><span class="modal-detail-label">اسم العميل</span><span class="modal-detail-value">${escapeHTML(customerName)}</span></div>
        `;
        openModal(detailsHTML, whatsappUrl, { formType: 'cards' });
    }
    
    // ===== Recharge Form Logic =====
    const rechargeServiceType = document.getElementById('recharge-service-type');
    const rechargeQuantityLabel = document.getElementById('recharge-quantity-label');
    const rechargeQuantityInput = document.getElementById('recharge-quantity');
    
    if (rechargeServiceType) {
        rechargeServiceType.addEventListener('change', function() {
            if (!rechargeQuantityLabel || !rechargeQuantityInput) return;
            
            if (this.value === 'رصيد') {
                rechargeQuantityLabel.textContent = 'المبلغ بالريال';
                rechargeQuantityInput.placeholder = 'مثال: 1000';
                rechargeQuantityInput.type = 'text';
                rechargeQuantityInput.setAttribute('inputmode', 'numeric');
            } else if (this.value === 'باقة نت') {
                rechargeQuantityLabel.textContent = 'حجم الباقة / نوعها';
                rechargeQuantityInput.placeholder = 'مثال: 3 جيجا أو اسم الباقة';
                rechargeQuantityInput.type = 'text';
                rechargeQuantityInput.removeAttribute('inputmode');
            } else {
                rechargeQuantityLabel.textContent = 'الكمية';
                rechargeQuantityInput.placeholder = 'أدخل الكمية المطلوبة';
                rechargeQuantityInput.type = 'text';
                rechargeQuantityInput.removeAttribute('inputmode');
            }
        });
    }
    
    // ===== Event Listeners (Event Delegation) =====
    function setupEventListeners() {
        // التنقل
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-nav]');
            if (navLink && navLink.dataset.nav) {
                e.preventDefault();
                handleNavigation(navLink.dataset.nav);
            }
            
            // أزرار التنقل في الهيدر
            const headerNav = e.target.closest('.nav-link');
            if (headerNav && headerNav.dataset.view) {
                e.preventDefault();
                handleNavigation(headerNav.dataset.view);
            }
        });
        
        // أزرار تقديم الطلبات
        document.addEventListener('click', (e) => {
            const submitBtn = e.target.closest('.btn-submit');
            if (submitBtn) {
                if (submitBtn.dataset.form === 'recharge') {
                    submitRecharge();
                } else if (submitBtn.dataset.form === 'cards') {
                    submitCards();
                }
            }
        });
        
        // أزرار المودال
        const modalConfirmBtn = document.getElementById('modalConfirmBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');
        
        if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', confirmOrder);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
        
        // إغلاق المودال عند الضغط على الخلفية
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) closeModal();
            });
        }
        
        // كيبورد
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalOverlay?.classList.contains('show')) {
                closeModal();
            }
        });
        
        // تحسين الـ resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (!IS_SLOW && particlesLoaded) {
                    resizeCanvas();
                    initParticles();
                }
            }, 250);
        });
    }
    
    // ===== Intersection Observer للجسيمات =====
    function setupParticlesObserver() {
        if (IS_SLOW) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && particlesLoaded && !animFrameId && particles.length > 0) {
                    animateParticles();
                } else if (!entry.isIntersecting && animFrameId) {
                    stopParticles();
                }
            });
        }, { threshold: 0.1 });
        
        const wrapper = document.querySelector('.app-wrapper');
        if (wrapper) observer.observe(wrapper);
    }
    
    // ===== التهيئة =====
    function init() {
        setupEventListeners();
        
        // تحميل الجسيمات بعد تأخير
        if (!IS_SLOW) {
            setTimeout(startParticlesLazy, 1000);
            setupParticlesObserver();
        }
        
        // تفعيل العرض الافتراضي
        handleNavigation('home');
        
        console.log('🌟 أم جمال للشحن الفوري - نسخة محسنة للأداء');
        console.log(IS_SLOW ? '📱 تم تفعيل وضع الأداء المنخفض' : '⚡ وضع الأداء العالي');
    }
    
    // بدء التطبيق بعد تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
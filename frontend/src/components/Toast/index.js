import React, { useEffect } from 'react';
import * as styles from './Toast.module.scss';
import classNames from 'classnames/bind';
import '@fortawesome/fontawesome-free/css/all.min.css';

const cx = classNames.bind(styles);

const isMobileDevice = () => {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const recentToasts = new Map();

export function showToast({ title = "", message = "", type = "info", duration = 3000, position = "top-right" }) {
    const main = document.getElementById("toast-container");
    const isMobile = isMobileDevice();
    
    const toastKey = `${title}-${message}-${type}`;
    
    const now = Date.now();
    if (recentToasts.has(toastKey)) {
        const lastShown = recentToasts.get(toastKey);
        if (now - lastShown < 3000) {
            console.log('Đã chặn toast trùng lặp:', toastKey);
            return;
        }
    }
    
    recentToasts.set(toastKey, now);
    
    setTimeout(() => {
        recentToasts.delete(toastKey);
    }, 10000);
    
    if (main) {
        const toast = document.createElement("div");
        
        const autoRemoveId = setTimeout(function () {
            toast.classList.add(cx('hide'));
            setTimeout(() => {
                if (main.contains(toast)) {
                    main.removeChild(toast);
                }
            }, 500);
        }, duration);
    
        const handleClose = function() {
            toast.classList.add(cx('hide'));
            clearTimeout(autoRemoveId);
            setTimeout(() => {
                if (main.contains(toast)) {
                    main.removeChild(toast);
                    console.log("Đã đóng thông báo");
                }
            }, 500);
        };
    
        const icons = {
            success: "fas fa-check-circle",
            info: "fas fa-info-circle",
            warning: "fas fa-exclamation-circle",
            error: "fas fa-exclamation-circle"
        };
        const icon = icons[type];
        const delay = (duration / 1000).toFixed(2);
    
        toast.classList.add(cx('toast'), cx(`toast--${type}`));
        
        if (isMobile) {
            toast.style.animation = `slideInBottom ease .3s, fadeOut linear 1s ${delay}s forwards`;
            toast.classList.add(cx('toast--mobile'));
        } else {
            toast.style.animation = `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards`;
        }
    
        toast.innerHTML = `
            <div class="${cx('toast__icon')}">
                <i class="${icon}"></i>
            </div>
            <div class="${cx('toast__body')}">
                <h3 class="${cx('toast__title')}">${title}</h3>
                <p class="${cx('toast__msg')}">${message}</p>
            </div>
            <div class="${cx('toast__close')}">
                <i class="fas fa-times"></i>
            </div>
        `;
        
        main.appendChild(toast);
        
        const closeButton = toast.querySelector(`.${cx('toast__close')}`);
        if (closeButton) {
            closeButton.addEventListener('click', handleClose);
        }
        
        if (isMobile) {
            toast.addEventListener('touchstart', function() {
                clearTimeout(autoRemoveId);
            });
            
            toast.addEventListener('touchend', function() {
                const newAutoRemoveId = setTimeout(function () {
                    toast.classList.add(cx('hide'));
                    setTimeout(() => {
                        if (main.contains(toast)) {
                            main.removeChild(toast);
                        }
                    }, 500);
                }, duration / 2);
            });
        } else {
            toast.addEventListener('mouseenter', function() {
                clearTimeout(autoRemoveId);
            });
            
            toast.addEventListener('mouseleave', function() {
                const newAutoRemoveId = setTimeout(function () {
                    toast.classList.add(cx('hide'));
                    setTimeout(() => {
                        if (main.contains(toast)) {
                            main.removeChild(toast);
                        }
                    }, 500);
                }, duration);
            });
        }
    }
}

function Toast() {
    useEffect(() => {
        if (!document.getElementById("toast-container")) {
            const container = document.createElement('div');
            container.id = "toast-container";
            container.className = cx('toast-container');
            document.body.appendChild(container);
            
            console.log("Toast container created");
        } else {
            console.log("Toast container already exists");
        }
        
        return () => {
            console.log("Toast component unmounted, container preserved");
        };
    }, []);
    
    return null;
}

export default Toast; 
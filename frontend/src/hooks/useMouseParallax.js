import { useEffect } from 'react';

/**
 * useMouseParallax — parallax nền sao theo chuột (desktop only).
 *
 * Cập nhật 2 CSS var --mx/--my (chuẩn hóa -1..1) trên một element mỗi khi
 * chuột di chuyển, qua requestAnimationFrame + lerp để chuyển động mượt.
 * Chỉ gắn listener khi thiết bị có chuột thật (hover:hover + pointer:fine)
 * → mobile/touch: 0 listener, sao đứng yên theo yêu cầu.
 *
 * @param {React.RefObject<HTMLElement>} ref - element nhận CSS var
 * @param {number} [damping=0.12] - mức đuổi theo chuột (0..1, càng nhỏ càng mượt)
 */
export function useMouseParallax(ref, damping = 0.12) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!hasFinePointer) return undefined;

        let targetX = 0;
        let targetY = 0;
        let curX = 0;
        let curY = 0;
        let rafId = null;

        const onMove = (e) => {
            targetX = (e.clientX / window.innerWidth) * 2 - 1;
            targetY = (e.clientY / window.innerHeight) * 2 - 1;
        };

        const tick = () => {
            curX += (targetX - curX) * damping;
            curY += (targetY - curY) * damping;
            el.style.setProperty('--mx', curX.toFixed(4));
            el.style.setProperty('--my', curY.toFixed(4));
            rafId = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        rafId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafId);
        };
    }, [ref, damping]);
}

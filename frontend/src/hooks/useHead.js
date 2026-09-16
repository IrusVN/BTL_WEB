import { useEffect } from 'react';


const SITE_NAME = 'Team2hand';

const titleStack = [];

export const useHead = (head) => {
    useEffect(() => {
        const prev = document.title;
        const resolved = typeof head === 'string' ? { title: head } : (head || {});
        let { title, description } = resolved;

        if (typeof title === 'string' && title.length > 0 && !title.includes(SITE_NAME)) {
            title = `${title} | ${SITE_NAME}`;
        }

        titleStack.push(prev);

        if (title) document.title = title;

        let metaEl = null;
        if (description) {
            metaEl = document.querySelector('meta[name="description"]')
                || (() => {
                    const el = document.createElement('meta');
                    el.setAttribute('name', 'description');
                    document.head.appendChild(el);
                    return el;
                })();
            const prevDesc = metaEl.getAttribute('content');
            metaEl.setAttribute('data-prev-content', prevDesc || '');
            metaEl.setAttribute('content', description);
        }

        return () => {
            const restore = titleStack.pop();
            if (restore !== undefined) document.title = restore;
            if (metaEl) {
                const prevDesc = metaEl.getAttribute('data-prev-content');
                if (prevDesc) {
                    metaEl.setAttribute('content', prevDesc);
                } else {
                    metaEl.remove();
                }
            }
        };
    }, [typeof head === 'string' ? head : JSON.stringify(head)]);
};

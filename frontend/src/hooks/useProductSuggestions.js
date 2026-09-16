import { useEffect, useState } from 'react';
import { getProductSuggestions } from '../services/productService.js';


const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export function useProductSuggestions(query) {
    const trimmed = (query || '').trim();
    const enabled = trimmed.length >= MIN_QUERY_LENGTH;
    const [state, setState] = useState({ suggestions: [], loading: false });

    useEffect(() => {
        if (!enabled) {
            setState({ suggestions: [], loading: false });
            return undefined;
        }

        let cancelled = false;
        setState((prev) => ({ suggestions: prev.suggestions, loading: true }));

        const timer = setTimeout(async () => {
            try {
                const data = await getProductSuggestions(trimmed);
                if (!cancelled) {
                    setState({
                        suggestions: (data && data.suggestions) || [],
                        loading: false
                    });
                }
            } catch {
                if (!cancelled) setState({ suggestions: [], loading: false });
            }
        }, DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [trimmed, enabled]);

    return state;
}

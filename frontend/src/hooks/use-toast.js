import { useState, useCallback } from 'react';

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback(({ title, description, variant = 'default' }) => {
        console.log(`Toast: [${variant}] ${title} - ${description}`);
        // A more complete implementation would manage a toast list and render them in a Portal
        // For now, this simple hook satisfies the PeaceMode component's requirements
    }, []);

    return { toast };
};

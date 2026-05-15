import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
    const location = useLocation();
    const [anim, setAnim] = useState('enter');

    useEffect(() => {
        setAnim('exit');
        const t = setTimeout(() => setAnim('enter'), 180);
        return () => clearTimeout(t);
    }, [location.pathname]);

    return (
        <>
            <style>{`
.pg-trans { transition: opacity 0.18s ease, transform 0.18s ease; }
.pg-trans--enter { opacity: 1; transform: translateY(0); }
.pg-trans--exit { opacity: 0; transform: translateY(8px); }
`}</style>
            <div className={`pg-trans pg-trans--${anim}`}>{children}</div>
        </>
    );
}

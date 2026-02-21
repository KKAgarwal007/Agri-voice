import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        return localStorage.getItem('agri_language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('agri_language', currentLanguage);
        document.documentElement.lang = currentLanguage;
    }, [currentLanguage]);

    const t = (key) => {
        return translations[currentLanguage]?.[key] || translations['en'][key] || key;
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'mr', name: 'मराठी' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'kn', name: 'ಕನ್ನಡ' }
    ];

    return (
        <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage, t, languages }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

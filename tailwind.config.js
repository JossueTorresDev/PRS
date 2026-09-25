/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Colores principales
                primary: {
                    DEFAULT: '#4F46E5',
                    hover: '#4338CA',
                    light: '#6366F1',
                    dark: '#3730A3',
                },
                secondary: {
                    DEFAULT: '#8B5CF6',
                    hover: '#7C3AED',
                    light: '#A78BFA',
                },

                // Estados
                success: {
                    DEFAULT: '#10B981',
                    light: '#34D399',
                    bg: '#D1FAE5',
                },
                danger: {
                    DEFAULT: '#EF4444',
                    hover: '#DC2626',
                    light: '#FCA5A5',
                    bg: '#FEE2E2',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    light: '#FCD34D',
                    bg: '#FEF3C7',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    light: '#60A5FA',
                    bg: '#DBEAFE',
                },

                // Sidebar
                sidebar: {
                    bg: '#1E293B',
                    hover: '#334155',
                    active: '#0F172A',
                    text: '#94A3B8',
                    'text-active': '#FFFFFF',
                },

                // Backgrounds
                bg: {
                    primary: '#F8FAFC',
                    secondary: '#F1F5F9',
                    white: '#FFFFFF',
                    gray: '#E2E8F0',
                },

                // Textos
                text: {
                    primary: '#0F172A',
                    secondary: '#475569',
                    muted: '#94A3B8',
                    white: '#FFFFFF',
                },

                // Bordes
                border: {
                    DEFAULT: '#E2E8F0',
                    light: '#F1F5F9',
                    dark: '#CBD5E1',
                },
            },

            spacing: {
                'xs': '0.25rem',   // 4px
                'sm': '0.5rem',    // 8px
                'md': '1rem',      // 16px
                'lg': '1.5rem',    // 24px
                'xl': '2rem',      // 32px
                '2xl': '3rem',     // 48px
            },

            borderRadius: {
                'sm': '0.25rem',   // 4px
                'md': '0.375rem',  // 6px
                'lg': '0.5rem',    // 8px
                'xl': '0.75rem',   // 12px
            },

            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            },

            transitionDuration: {
                'fast': '150ms',
                'base': '200ms',
                'slow': '300ms',
            },

            zIndex: {
                'dropdown': '1000',
                'sticky': '1020',
                'fixed': '1030',
                'modal-backdrop': '1040',
                'modal': '1050',
                'popover': '1060',
                'tooltip': '1070',
            },
        },
    },
    plugins: [],
};

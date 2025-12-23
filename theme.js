tailwind.config = {
    theme: {
        extend: {
            colors: {
                wa: {
                    teal: '#008069',   // Modern WA Teal
                    dark: '#075E54',   // Header Dark
                    light: '#25D366',  // WA Green (Buttons)
                    chat: '#E5E0DA',   // Official Chat BG
                    surface: '#FFFFFF',
                    accent: '#34B7F1'  // WA Blue
                },
                campus: {
                    blue: '#003366',
                    gold: '#FFD700'
                }
            },
            animation: {
                'fade': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'marquee': 'marquee 20s linear infinite',
                'bounce-slow': 'bounce 3s infinite',
                'cart-move': 'cartMove 2s ease-in-out infinite'
            }
        }
    }
}

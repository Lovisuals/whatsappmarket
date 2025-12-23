tailwind.config = {
    theme: {
        extend: {
            colors: {
                wa: {
                    teal: '#075E54',   // Dark Teal
                    light: '#128C7E',  // Light Teal
                    green: '#25D366',  // Bright Green
                    chat: '#ECE5DD',   // Chat Background
                    gold: '#FFD700'    // Premium Gold
                },
                campus: {
                    blue: '#003366',   // University Blue
                    gold: '#FFD700'    // University Gold
                }
            },
            animation: {
                'fade': 'fadeIn 0.4s ease-out forwards',
                'marquee': 'marquee 15s linear infinite',
                'flash': 'flash 2s ease-out',
                'shake': 'shake 0.5s'
            }
        }
    }
}

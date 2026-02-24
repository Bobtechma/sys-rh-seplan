if (!window.Loader) {
    window.Loader = {
        init() {
            if (document.getElementById('global-loader')) return;

            const loaderHtml = `
                <div id="global-loader" class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none">
                    <div class="flex flex-col items-center gap-4">
                        <div class="relative size-12">
                            <div class="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                            <div class="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        </div>
                        <p class="text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse">Carregando dados...</p>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', loaderHtml);
        },

        show() {
            this.init();
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.classList.remove('opacity-0', 'pointer-events-none');
            }
        },

        hide() {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.classList.add('opacity-0', 'pointer-events-none');
            }
        }
    };

    // Auto-init on load
    document.addEventListener('DOMContentLoaded', () => {
        window.Loader.init();
    });
}

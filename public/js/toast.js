
if (!window.Toast) {
    window.Toast = {
        init() {
            if (!document.getElementById('toast-container')) {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
                document.body.appendChild(container);
            }
        },

        show(message, type = 'info', duration = 3000) {
            this.init();
            const container = document.getElementById('toast-container');

            const toast = document.createElement('div');
            toast.className = `
                flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 transition-all transform translate-x-full opacity-0
            `;

            let icon = '';
            let iconColor = '';

            switch (type) {
                case 'success':
                    icon = 'check_circle';
                    iconColor = 'text-green-500 bg-green-100 dark:bg-green-800 dark:text-green-200';
                    break;
                case 'error':
                    icon = 'error';
                    iconColor = 'text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200';
                    break;
                case 'warning':
                    icon = 'warning';
                    iconColor = 'text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200';
                    break;
                default:
                    icon = 'info';
                    iconColor = 'text-blue-500 bg-blue-100 dark:bg-blue-800 dark:text-blue-200';
            }

            toast.innerHTML = `
                <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${iconColor} rounded-lg">
                    <span class="material-symbols-outlined text-sm">${icon}</span>
                </div>
                <div class="ml-3 text-sm font-normal">${message}</div>
                <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" aria-label="Close">
                    <span class="sr-only">Close</span>
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            `;

            // Close button functionality
            toast.querySelector('button').addEventListener('click', () => {
                this.dismiss(toast);
            });

            container.appendChild(toast);

            // Animate in
            requestAnimationFrame(() => {
                toast.classList.remove('translate-x-full', 'opacity-0');
            });

            // Auto dismiss
            if (duration > 0) {
                setTimeout(() => {
                    this.dismiss(toast);
                }, duration);
            }
        },

        dismiss(toast) {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300); // Wait for transition
        }
    };
}

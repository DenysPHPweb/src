function createCookiesEuBanner() {
    return {
        show: localStorage.getItem('show_cookies-eu-banner') || true,
        hideBanner() {
            localStorage.setItem('show_cookies-eu-banner', false)
            this.show = false
            return false
        }
    }
}
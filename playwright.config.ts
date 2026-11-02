import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npx vite preview --port 5173 --host 127.0.0.1',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
    projects: [
        {
            name: 'phone-xs-320x568',
            use: {
                viewport: { width: 320, height: 568 },
                hasTouch: true,
                isMobile: true,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            },
        },
        {
            name: 'phone-compact-360x640',
            use: {
                viewport: { width: 360, height: 640 },
                hasTouch: true,
                isMobile: true,
            },
        },
        {
            name: 'iphone-x-375x812',
            use: {
                ...devices['iPhone X'],
            },
        },
        {
            name: 'iphone-14-390x844',
            use: {
                ...devices['iPhone 14'],
            },
        },
        {
            name: 'pixel-7-412x915',
            use: {
                ...devices['Pixel 7'],
            },
        },
        {
            name: 'tablet-portrait-768x1024',
            use: {
                ...devices['iPad Mini'],
            },
        },
        {
            name: 'tablet-landscape-1024x768',
            use: {
                ...devices['iPad Mini landscape'],
            },
        },
        {
            name: 'laptop-hd-1280x720',
            use: {
                viewport: { width: 1280, height: 720 },
            },
        },
        {
            name: 'macbook-1440x900',
            use: {
                viewport: { width: 1440, height: 900 },
            },
        },
        {
            name: 'desktop-fhd-1920x1080',
            use: {
                viewport: { width: 1920, height: 1080 },
            },
        },
        {
            name: 'qhd-2560x1440',
            use: {
                viewport: { width: 2560, height: 1440 },
            },
        },
        {
            name: 'ultrawide-3440x1440',
            use: {
                viewport: { width: 3440, height: 1440 },
            },
        },
        {
            name: 'landscape-phone-812x375',
            use: {
                viewport: { width: 812, height: 375 },
                hasTouch: true,
                isMobile: true,
            },
        },
        {
            name: 'foldable-closed-673x841',
            use: {
                viewport: { width: 673, height: 841 },
                hasTouch: true,
                isMobile: true,
            },
        },
        {
            name: 'foldable-open-1280x800',
            use: {
                viewport: { width: 1280, height: 800 },
                hasTouch: true,
                isMobile: true,
            },
        },
    ],
})

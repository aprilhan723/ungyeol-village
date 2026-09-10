import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'**/*.spec.js',timeout:30000,workers:1,use:{baseURL:process.env.BASE_URL||'http://127.0.0.1:5173',headless:true,launchOptions:{executablePath:process.env.CHROMIUM_PATH},viewport:{width:1440,height:1000}},reporter:'list'});

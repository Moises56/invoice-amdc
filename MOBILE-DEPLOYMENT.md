# 📱 Mobile Deployment Instructions

## ✅ Fixed Issues
1. **Network Security Configuration**: Created `network_security_config.xml` for Android HTTPS connections
2. **Capacitor Configuration**: Enhanced with HTTP and Cookie support
3. **HTTP Interceptor**: Updated to handle mobile-specific headers
4. **Android Permissions**: Added proper permissions and removed duplicates
5. **API Configuration**: Verified production API URL (`https://merc-fact-back.onrender.com/api`)

## 🔧 What Was Fixed

### 1. Network Security Configuration (`android/app/src/main/res/xml/network_security_config.xml`)
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow localhost for development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.1</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
    
    <!-- Allow HTTPS connections to your production API -->
    <domain-config>
        <domain includeSubdomains="true">merc-fact-back.onrender.com</domain>
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </domain-config>
    
    <!-- Base configuration for all other domains -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
```

### 2. Enhanced Capacitor Configuration (`capacitor.config.ts`)
```typescript
const config: CapacitorConfig = {
  appId: 'com.example.invoiceamdc',
  appName: 'Invoice-amdc',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    }
  }
};
```

### 3. Updated HTTP Interceptor (`src/app/core/interceptors/auth.interceptor.ts`)
- Added mobile platform detection
- Enhanced headers for mobile compatibility
- Improved CORS handling

### 4. Android Permissions (`android/app/src/main/AndroidManifest.xml`)
- Added Bluetooth permissions for printer functionality
- Added location permissions (required for Bluetooth scanning)
- Removed duplicate internet permissions
- Added network security configuration reference

## 🚀 Build and Deploy Commands

### Step 1: Build for Production
```bash
cd "c:\Users\GIS-MOISES\Desktop\WEBAPPS\Factura-Mecados\ionic-proyects\Invoice-amdc"
ionic build --prod
```

### Step 2: Sync with Capacitor
```bash
npx cap sync android
```

### Step 3: Build APK (Debug)
```bash
npx cap build android
```

### Step 4: Build APK (Release)
```bash
cd android
./gradlew assembleRelease
```

### Step 5: Find APK Files
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

## 🧪 Testing API Connectivity

### Option 1: Use the Test Page
Open `api-test.html` in a browser to test API connectivity before building the APK.

### Option 2: Test in Browser
Visit: `https://merc-fact-back.onrender.com/api/health`

## 📱 Mobile Testing Steps

1. **Install the APK** on your Android device
2. **Enable Developer Options** and USB Debugging
3. **Connect via USB** and use Chrome DevTools:
   - Open Chrome: `chrome://inspect`
   - Select your device
   - View console logs

## 🔍 Troubleshooting

### If API calls still fail:

1. **Check Network Connection**
   - Ensure device has internet access
   - Try accessing the API URL in mobile browser

2. **Verify API Status**
   - Test: `https://merc-fact-back.onrender.com/api/health`
   - Check if server is running

3. **SSL Certificate Issues**
   - Clear app data
   - Reinstall the APK
   - Check if HTTPS certificates are valid

4. **CORS Issues**
   - Verify backend CORS configuration
   - Check if mobile user agent is allowed

### Common Error Fixes:

- **Network Security Exception**: Fixed with `network_security_config.xml`
- **CORS Errors**: Fixed with enhanced HTTP interceptor
- **SSL Handshake Failed**: Fixed with proper certificate trust configuration
- **Connection Timeout**: API server might be cold-starting (Render.com)

## 📊 API Endpoints to Test

1. `GET /api/health` - Server health check
2. `POST /api/auth/login` - Authentication
3. `GET /api/mercados` - Markets data
4. `GET /api/facturas` - Invoices data

## 🔐 Security Notes

- Uses HTTPS for all API communications
- Proper SSL certificate validation
- Network security configuration for Android
- Cookie-based authentication with credentials

## ⚡ Performance Tips

1. **Render.com Cold Start**: First API call might be slow (30-60 seconds)
2. **Background Requests**: App should handle loading states
3. **Offline Support**: Consider implementing offline data caching
4. **Connection Retry**: Implement retry logic for failed requests

Your app should now successfully connect to the API when deployed as an APK! 🎉

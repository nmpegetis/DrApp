// This section sets up some basic app metadata, the entire section is optional.
App.info({
    id: 'com.drapp.code',
    name: 'DrApp',
    description: 'Call for a doctor\'s help instantly with only a button click',
    author: 'DrApp',
    email: 'DrApp@drapp.com',
    website: 'http://drapp.eu.meteorapp.com',
    version: '1.1.0'
});
// Set up resources such as icons and launch screens.
App.icons({
    // 'iphone_2x': 'icons/icon-60@2x.png',
    // 'iphone_3x': 'icons/icon-60@3x.png',
    'android_mdpi': 'dr2.png',
    'android_hdpi': 'dr2.png',
    'android_xhdpi': 'dr2.png',
    'android_xxhdpi': 'dr2.png',
    'android_xxxhdpi': 'dr2.png'
    // More screen sizes and platforms...
});
App.launchScreens({
    // 'iphone_2x': 'splash/Default@2x~iphone.png',
    // 'iphone5': 'splash/Default~iphone5.png'
    'android_mdpi_portrait': 'dr2.png',
    'android_mdpi_landscape': 'dr2.png',
    'android_hdpi_portrait': 'dr2.png',
    'android_hdpi_landscape': 'dr2.png',
    'android_xhdpi_portrait': 'dr2.png',
    'android_xhdpi_landscape': 'dr2.png',
    'android_xxhdpi_portrait': 'dr2.png',
    'android_xxhdpi_landscape': 'dr2.png',
    'android_xxxhdpi_portrait': 'dr2.png',
    'android_xxxhdpi_landscape': 'dr2.png'
    // More screen sizes and platforms...
});
// Set PhoneGap/Cordova preferences.
App.setPreference('BackgroundColor', '0x009933ff');
App.setPreference('HideKeyboardFormAccessoryBar', true);
App.setPreference('Orientation', 'default');
App.setPreference('Orientation', 'all', 'ios');
App.setPreference('android-minSdkVersion' , '14');  //Andoid 4.0
// App.setPreference('android-installLocation' , 'preferExternal'); //http://docs.phonegap.com/phonegap-build/configuring/preferences/  // also internalOnly and auto

// Pass preferences for a particular PhoneGap/Cordova plugin.
// App.configurePlugin('com.phonegap.plugins.facebookconnect', {
//     APP_ID: '1234567890',
//     API_KEY: 'supersecretapikey'
// });

// App.accessRule('data:*', { type: 'navigation' });
App.accessRule('https://*');
App.accessRule('*', { type: 'navigation' });

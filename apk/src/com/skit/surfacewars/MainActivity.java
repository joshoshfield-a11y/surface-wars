package com.skit.surfacewars;
import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
public class MainActivity extends Activity {
  private WebView webView;
  @Override protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    webView = new WebView(this);
    setContentView(webView);
    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowContentAccess(true);
    s.setBuiltInZoomControls(false);
    s.setDisplayZoomControls(false);
    s.setSupportZoom(false);
    s.setUseWideViewPort(true);
    s.setLoadWithOverviewMode(true);
    webView.setWebViewClient(new WebViewClient());
    webView.loadUrl("file:///android_asset/game/index.html");
  }
  @Override public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) { webView.goBack(); return true; }
    return super.onKeyDown(keyCode, event);
  }
  @Override protected void onDestroy() { if (webView != null) webView.destroy(); super.onDestroy(); }
}

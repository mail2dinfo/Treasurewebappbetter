package in.mytreasure.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UpiPayPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null) {
            getBridge().addWebViewListener(new WebViewListener() {
                @Override
                public void onPageLoaded(WebView view) {
                    attachUpiBridge();
                }
            });
        }
        attachUpiBridge();
    }

    @Override
    public void onStart() {
        super.onStart();
        attachUpiBridge();
    }

    private void attachUpiBridge() {
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        webView.addJavascriptInterface(new UpiJsInterface(this), "MytreasureUpi");
    }
}

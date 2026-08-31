package in.mytreasure.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UpiPayPlugin.class);
        super.onCreate(savedInstanceState);
        installUpiWebViewClient();
    }

    @Override
    public void onStart() {
        super.onStart();
        installUpiWebViewClient();
    }

    private void installUpiWebViewClient() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (url != null && isPayScheme(url.getScheme())) {
                    launchPayUrl(url.toString());
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && isPayUrl(url)) {
                    launchPayUrl(url);
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, url);
            }
        });
    }

    private boolean isPayScheme(String scheme) {
        return "upi".equals(scheme)
            || "phonepe".equals(scheme)
            || "intent".equals(scheme)
            || "tez".equals(scheme)
            || "gpay".equals(scheme)
            || "paytmmp".equals(scheme);
    }

    private boolean isPayUrl(String url) {
        return url.startsWith("upi:")
            || url.startsWith("phonepe:")
            || url.startsWith("intent:")
            || url.startsWith("tez:")
            || url.startsWith("gpay:")
            || url.startsWith("paytmmp:");
    }

    private void launchPayUrl(String url) {
        if (url.startsWith("intent:")) {
            try {
                Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return;
            } catch (Exception ignored) {
                // fall through
            }
        }
        UpiLauncher.open(this, url);
    }
}

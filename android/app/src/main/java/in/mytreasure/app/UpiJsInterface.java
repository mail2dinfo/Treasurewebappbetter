package in.mytreasure.app;

import android.app.Activity;
import android.webkit.JavascriptInterface;

public class UpiJsInterface {

    private final Activity activity;

    public UpiJsInterface(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void open(String url) {
        UpiLauncher.open(activity, url);
    }
}

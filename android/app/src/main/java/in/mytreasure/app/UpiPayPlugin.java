package in.mytreasure.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "UpiPay")
public class UpiPayPlugin extends Plugin {

    private static final String[] PAY_PACKAGES = {
        "com.phonepe.app",
        "com.phonepe.app.preprod",
        "com.google.android.apps.nbu.paisa.user",
        "net.one97.paytm",
        "in.org.npci.upiapp"
    };

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("Missing url");
            return;
        }

        try {
            Intent intent = url.startsWith("intent:")
                ? Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                : new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            String requestedPackage = call.getString("packageName");
            if (requestedPackage != null && !requestedPackage.isEmpty() && isInstalled(requestedPackage)) {
                intent.setPackage(requestedPackage);
                getActivity().startActivity(intent);
                call.resolve();
                return;
            }

            for (String pkg : PAY_PACKAGES) {
                if (!isInstalled(pkg)) {
                    continue;
                }
                Intent targeted = new Intent(intent);
                targeted.setPackage(pkg);
                try {
                    getActivity().startActivity(targeted);
                    call.resolve();
                    return;
                } catch (Exception ignored) {
                    // try next UPI app
                }
            }

            getActivity().startActivity(Intent.createChooser(intent, "Pay with UPI"));
            call.resolve();
        } catch (Exception ex) {
            call.reject("Unable to open PhonePe. Install PhonePe or another UPI app.");
        }
    }

    private boolean isInstalled(String packageName) {
        try {
            getContext().getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }
}

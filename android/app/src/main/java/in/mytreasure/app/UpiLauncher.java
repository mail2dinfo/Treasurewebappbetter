package in.mytreasure.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

final class UpiLauncher {

    private static final String[] PAY_PACKAGES = {
        "com.phonepe.app",
        "com.phonepe.app.preprod",
        "com.google.android.apps.nbu.paisa.user",
        "net.one97.paytm",
        "in.org.npci.upiapp"
    };

    private UpiLauncher() {}

    static void open(Activity activity, String url) {
        if (activity == null || url == null || url.isEmpty()) {
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if (url.startsWith("intent:")) {
                    Intent parsed = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                    parsed.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(parsed);
                    return;
                }

                Uri uri = Uri.parse(url);
                Intent base = new Intent(Intent.ACTION_VIEW, uri);
                base.addCategory(Intent.CATEGORY_BROWSABLE);

                for (String pkg : PAY_PACKAGES) {
                    try {
                        Intent targeted = new Intent(Intent.ACTION_VIEW, uri);
                        targeted.setPackage(pkg);
                        targeted.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        activity.startActivity(targeted);
                        return;
                    } catch (Exception ignored) {
                        // try next app
                    }
                }

                try {
                    Intent open = new Intent(Intent.ACTION_VIEW, uri);
                    open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(open);
                    return;
                } catch (Exception ignored) {
                    // fall through to chooser
                }

                Intent chooser = Intent.createChooser(base, "Pay with UPI");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(chooser);
            } catch (Exception ex) {
                Toast.makeText(
                    activity,
                    "Could not open PhonePe. Copy the UPI ID and pay in PhonePe.",
                    Toast.LENGTH_LONG
                ).show();
            }
        });
    }
}

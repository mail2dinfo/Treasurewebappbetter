package in.mytreasure.app;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.widget.Toast;

final class UpiLauncher {

    private static final String PHONEPE = "com.phonepe.app";
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
                Uri uri = Uri.parse(url);
                Intent base = new Intent(Intent.ACTION_VIEW, uri);

                if (tryPackage(activity, base, PHONEPE)) {
                    return;
                }

                for (String pkg : PAY_PACKAGES) {
                    if (PHONEPE.equals(pkg)) {
                        continue;
                    }
                    if (tryPackage(activity, base, pkg)) {
                        return;
                    }
                }

                Intent chooser = Intent.createChooser(new Intent(base), "Pay with UPI");
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

    private static boolean tryPackage(Activity activity, Intent base, String packageName) {
        if (!isInstalled(activity, packageName)) {
            return false;
        }
        try {
            Intent targeted = new Intent(base);
            targeted.setPackage(packageName);
            targeted.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(targeted);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static boolean isInstalled(Activity activity, String packageName) {
        try {
            activity.getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }
}

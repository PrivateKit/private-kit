package edu.mit.privatekit;
import com.facebook.react.ReactActivity;
import android.app.NotificationManager;
import android.app.Notification;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.Builder;
import android.content.Context;
import android.app.NotificationChannel;
import android.provider.Settings;

public class MainActivity extends ReactActivity {
  public static final String NOTIFICATION_CHANNEL_ID = "10001";

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "PrivateKit";
  }
 
  @Override
  protected void onDestroy() {
      super.onDestroy();
      showNotification();
  }

  private void showNotification() {
    NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(getApplicationContext());
    mBuilder.setSmallIcon(R.mipmap.ic_launcher);
    mBuilder.setContentTitle("Private Kit Enabled")
            .setContentText("Private Kit is securely storing your GPS coordinates once every five minutes on this device.")
            .setAutoCancel(false)
            .setSound(Settings.System.DEFAULT_NOTIFICATION_URI);

    NotificationManager mNotificationManager = (NotificationManager) getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);

    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O)
    {
        int importance = NotificationManager.IMPORTANCE_HIGH;
        NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "PRIVATE KIT", importance);
        notificationChannel.enableLights(true);
        notificationChannel.enableVibration(true);
        notificationChannel.setVibrationPattern(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400});
        assert mNotificationManager != null;
        mBuilder.setChannelId(NOTIFICATION_CHANNEL_ID);
        mNotificationManager.createNotificationChannel(notificationChannel);
    }
    assert mNotificationManager != null;
    mNotificationManager.notify(0 /* Request Code */, mBuilder.build());
 }
}

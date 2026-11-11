/**
 * Android push notification look & behaviour for Firebase Cloud Messaging.
 *
 * - White monochrome status-bar icon (Android ignores colour in small icons;
 *   without one it shows a grey square) + brand accent colour.
 * - A high-importance "Messages & matches" channel, created at app start.
 *   Channel importance is what makes Android show heads-up banners; FCM's
 *   fallback channel only drops pushes silently into the tray.
 * - That channel and icon set as Firebase's defaults.
 *
 * The android/ folder is regenerated on every EAS build, so this has to be a
 * config plugin rather than hand edits.
 */
const fs = require("fs")
const path = require("path")
const {
  AndroidConfig,
  withAndroidColors,
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require("expo/config-plugins")

const CHANNEL_ID = "constela_default"
const CHANNEL_NAME = "Messages & matches"
const ICON_NAME = "notification_icon"
const COLOR_NAME = "notification_color"
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]

function withIcons(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const resDir = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/res")
      for (const density of DENSITIES) {
        const src = path.join(cfg.modRequest.projectRoot, `assets/notification/${ICON_NAME}_${density}.png`)
        const dir = path.join(resDir, `drawable-${density}`)
        fs.mkdirSync(dir, { recursive: true })
        fs.copyFileSync(src, path.join(dir, `${ICON_NAME}.png`))
      }
      return cfg
    },
  ])
}

function withColor(config, color) {
  return withAndroidColors(config, (cfg) => {
    cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, { name: COLOR_NAME, value: color })
    return cfg
  })
}

function setMeta(app, name, attrs) {
  app["meta-data"] = (app["meta-data"] || []).filter((m) => m.$["android:name"] !== name)
  app["meta-data"].push({ $: { "android:name": name, ...attrs } })
}

function withFirebaseDefaults(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] || "http://schemas.android.com/tools"
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults)
    // tools:replace: @react-native-firebase/messaging declares some of these too.
    setMeta(app, "com.google.firebase.messaging.default_notification_icon", {
      "android:resource": `@drawable/${ICON_NAME}`,
      "tools:replace": "android:resource",
    })
    setMeta(app, "com.google.firebase.messaging.default_notification_color", {
      "android:resource": `@color/${COLOR_NAME}`,
      "tools:replace": "android:resource",
    })
    setMeta(app, "com.google.firebase.messaging.default_notification_channel_id", {
      "android:value": CHANNEL_ID,
      "tools:replace": "android:value",
    })
    return cfg
  })
}

function withChannel(config) {
  return withMainApplication(config, (cfg) => {
    const marker = "// constela-notification-channel"
    if (cfg.modResults.contents.includes(marker)) return cfg
    const code = `
    ${marker}
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      val channel = android.app.NotificationChannel(
        "${CHANNEL_ID}", "${CHANNEL_NAME}", android.app.NotificationManager.IMPORTANCE_HIGH
      )
      channel.description = "New messages, matches, likes and friend requests"
      channel.enableVibration(true)
      getSystemService(android.app.NotificationManager::class.java).createNotificationChannel(channel)
    }`
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /(override fun onCreate\(\)\s*\{\s*super\.onCreate\(\))/,
      `$1${code}`
    )
    if (!cfg.modResults.contents.includes(marker)) {
      throw new Error("withAndroidNotifications: could not find MainApplication.onCreate()")
    }
    return cfg
  })
}

module.exports = function withAndroidNotifications(config, { color = "#DE4177" } = {}) {
  config = withIcons(config)
  config = withColor(config, color)
  config = withFirebaseDefaults(config)
  config = withChannel(config)
  return config
}

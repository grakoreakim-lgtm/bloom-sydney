/**
 * Web Push (FCM) configuration.
 *
 * To enable new-order push notifications:
 *   1. Open Firebase Console → Project Settings → Cloud Messaging
 *   2. Under "Web Push certificates" click "Generate key pair"
 *   3. Copy the key (starts with "B…", ~88 chars long)
 *   4. Paste it below as VAPID_KEY
 *   5. Commit & deploy
 *
 * The VAPID public key is meant to be exposed to the browser — it's safe to commit.
 */
export const VAPID_KEY = ""; // ← paste your key here, e.g. "BHk7n…XYZ"

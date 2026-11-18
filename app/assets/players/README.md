# Player photos for Guess the Player

Put one photo per player in this folder, then switch it on in `src/data/games/players.ts`.

1. **Name the file after the player's id** in `players.ts`, e.g. `salah.jpg`, `saladin.jpg`, `messi.jpg`.
2. **Use a square image**, about 600 × 600 px, compressed to under 100 KB. The game zooms in and blurs it at the early clues, so the face should be near the centre.
3. **Add a line to `PHOTOS`** in `players.ts`:

   ```ts
   const PHOTOS: Record<string, ImageSourcePropType> = {
     salah: require('../../../assets/players/salah.jpg'),
   };
   ```

A player without a photo shows a silhouette, so you can add photos one at a time.

**Rights.** Only add photos you have permission to use: licensed agency photos, photos from clubs or the federation with their agreement, or the client's own match photos. Player photos are a licensing risk otherwise.

**Demo note.** The blur is applied on the phone, so the clear photo ships inside the app. That is fine for a demo. A real release should send a pre-blurred image for each clue from a server.

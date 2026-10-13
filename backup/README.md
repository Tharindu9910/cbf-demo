# Backups

- `plain-aluminum-can/`: the generic can the site used before the real 250 ml can
  (`plain_aluminum_can.fbx`) and the `sodaCan.ts` that loaded it. To restore it, copy
  the FBX back to `public/models/`, replace `src/scripts/three/sodaCan.ts` with this copy,
  and point the model preload in `src/layouts/Base.astro` back at the FBX.
- `real-can-250ml-source/`: the FBX export and the Blender script that built
  `public/models/real_can_250ml.glb`.

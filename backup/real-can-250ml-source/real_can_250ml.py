"""
250 ml slim aluminium can, rebuilt from measured photos (IMG_0803..0807).

Measured with the ruler in the photos:
    overall height (seam top -> standing ring) 130.5 mm   (IMG_0804)
    lid double-seam outer diameter             50.5 mm    (IMG_0803)
    body diameter                              51.0 mm    (0804/0805 ratio)
    neck (red box)  ~1 mm radial inset, 4-5 mm shoulder taper, then a
                    ~2.9 mm double-seam flange flaring back to ~body width
    tab 22.6 x 15.5 mm, finger hole 10.5 x 8.4 mm, rivet dia 3.7 at centre
    pour score 22 mm wide, +1.2 .. +16.3 mm from centre, raised bead around

The can is modelled SEALED (pour panel closed, tab flat), bare glossy
aluminium, no label.

Run headless or via BlenderMCP:
    blender --background --python real_can_250ml.py
Outputs beside the .blend if saved, else on the Desktop.
"""

import bpy
import bmesh
import math
import os
import traceback
import mathutils

MM = 0.001
N = 192                    # radial segments

BODY_R = 25.50             # body dia 51.0
SEAM_R = 25.25             # seam dia 50.5
NECK_R = 24.50             # ~1 mm inset under the seam (red box)
HEIGHT = 130.5             # seam top above the standing ring
LID_H = 3.9                # seam top -> lid panel depth, measured from IMG_0807
PANEL_Z = HEIGHT - LID_H


def lid(depth, r):
    """Lid ring at a depth below the seam top, authored for a 4.9 mm recess
    and scaled to LID_H (the 0.3 mm seam-top roll is kept as-is)."""
    k = (LID_H - 0.3) / (4.9 - 0.3)
    return (HEIGHT - (0.3 + (depth - 0.3) * k), r)

# (z_mm, r_mm), bottom dome apex -> lid centre. Index where the end (lid) starts.
PROFILE = [
    # --- base: dome, steep inner wall, standing ring, short tight chamfer ---
    (10.50, 0.0),
    (10.25, 4.0),
    (9.60, 8.0),
    (8.40, 12.0),
    (6.80, 15.5),
    (5.20, 18.0),
    (4.20, 19.4),          # dome edge
    (2.80, 20.6),          # inner wall
    (1.20, 21.8),
    (0.35, 22.6),
    (0.00, 23.2),          # standing ring (contact), dia ~46.4
    (0.20, 23.8),
    (0.80, 24.40),         # tight chamfer, only ~1.7 mm inset (IMG_0806)
    (1.70, 24.95),
    (2.70, 25.30),
    (3.80, 25.47),
    (4.80, BODY_R),
    # --- straight body ---
    (122.30, BODY_R),
    # --- red box: short shoulder taper into the neck ---
    (123.60, 25.42),
    (124.80, 25.15),
    (125.80, 24.82),
    (126.50, 24.58),
    (127.20, NECK_R),
    # --- double-seam flange (end starts here) ---
    (127.45, 24.65),
    (127.60, 25.00),
    (127.85, SEAM_R - 0.03),
    (128.30, SEAM_R),
    (128.85, SEAM_R),
    (128.95, SEAM_R - 0.13),   # double-seam line
    (129.05, SEAM_R),
    (130.00, SEAM_R),
    (130.30, 25.05),
    (HEIGHT, 24.60),           # seam top
    (130.45, 24.10),
    (130.20, 23.80),           # seam inner edge
    # --- chuck wall down into the countersink (depths below seam top) ---
    lid(1.10, 23.45),
    lid(2.70, 22.80),
    lid(4.50, 22.10),
    lid(5.70, 21.65),
    lid(6.25, 21.35),
    lid(6.30, 21.05),          # countersink bottom
    lid(6.05, 20.80),
    # --- panel wall up to the flat panel ---
    lid(5.30, 20.60),
    lid(4.95, 20.30),
    (PANEL_Z, 20.00),
    (PANEL_Z, 10.00),
    (PANEL_Z + 0.02, 0.0),     # lid centre
]
END_START = next(i for i, (z, r) in enumerate(PROFILE) if z >= 127.4)  # first seam ring

# Lid features, in mm on the panel plane. +Y points toward the pour opening.
TAB_OUTLINE = [(0, -16.2), (4.0, -16.0), (6.6, -15.0), (7.6, -12.8), (7.75, -9.0),
               (7.6, -4.0), (7.2, 0.0), (6.6, 2.6), (5.3, 4.8), (3.0, 6.0), (0, 6.4)]
FINGER_HOLE = [(0, -14.0), (3.2, -13.8), (4.9, -12.6), (5.25, -10.5), (5.0, -7.4),
               (3.8, -5.9), (0, -5.6)]
RIVET_SLOT = [(0, -4.7), (2.6, -4.6), (3.6, -3.9), (3.4, -2.8), (2.3, -2.3), (0, -2.25)]
POUR_SCORE = [(0, 1.1), (3.5, 1.4), (7.0, 2.6), (9.8, 5.2), (11.0, 8.5), (10.3, 11.5),
              (6.5, 14.8), (0, 16.3)]
BEAD = [(0, -17.5), (5.5, -16.9), (8.5, -14.5), (9.2, -10.5), (9.5, -6.0), (10.5, -1.0),
        (12.3, 3.4), (12.9, 8.0), (12.6, 12.0), (11.0, 15.4), (7.2, 17.6), (0, 18.2)]


# ---------------------------------------------------------------- geometry
def lathe(profile, segments):
    verts, ring = [], []
    for z, r in profile:
        if abs(r) < 1e-9:
            ring.append(("pole", len(verts)))
            verts.append((0.0, 0.0, z * MM))
        else:
            start = len(verts)
            for i in range(segments):
                a = 2.0 * math.pi * i / segments
                verts.append((r * MM * math.cos(a), r * MM * math.sin(a), z * MM))
            ring.append(("ring", start))
    faces, seg_of_face = [], []
    for k in range(len(profile) - 1):
        (t0, s0), (t1, s1) = ring[k], ring[k + 1]
        for i in range(segments):
            j = (i + 1) % segments
            if t0 == "ring" and t1 == "ring":
                faces.append((s0 + i, s0 + j, s1 + j, s1 + i))
            elif t0 == "pole":
                faces.append((s0, s1 + i, s1 + j))
            else:
                faces.append((s0 + i, s0 + j, s1))
            seg_of_face.append(k)
    return verts, faces, seg_of_face


def mirror_half(half):
    """Half outline (0,ymin) -> +X side -> (0,ymax) into a closed CCW loop."""
    return list(half) + [(-x, y) for (x, y) in reversed(half[1:-1])]


def catmull_closed(pts, per_seg=10):
    out, n = [], len(pts)
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        for s in range(per_seg):
            t = s / per_seg
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t
                       + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2
                       + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)
                for c in (0, 1)))
    return out


def prism(name, outline_mm, z0_mm, th_mm):
    """Extrude a closed 2D outline (mm) from z0 up by th."""
    bm = bmesh.new()
    bot = [bm.verts.new((x * MM, y * MM, z0_mm * MM)) for x, y in outline_mm]
    top = [bm.verts.new((x * MM, y * MM, (z0_mm + th_mm) * MM)) for x, y in outline_mm]
    bm.faces.new(top)
    bm.faces.new(list(reversed(bot)))
    n = len(outline_mm)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return o


def tube(name, outline_mm, z_mm, radius_mm, mat):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(len(outline_mm) - 1)
    for i, (x, y) in enumerate(outline_mm):
        sp.points[i].co = (x * MM, y * MM, z_mm * MM, 1.0)
    sp.use_cyclic_u = True
    cu.bevel_depth = radius_mm * MM
    cu.bevel_resolution = 4
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    select_only(o)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.view_layer.objects.active
    o.data.materials.append(mat)
    smooth(o, 60)
    return o


def select_only(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o


def smooth(obj, angle_deg=35.0):
    for p in obj.data.polygons:
        p.use_smooth = True
    try:
        select_only(obj)
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angle_deg))
    except Exception:
        pass


def boolean_cut(target, cutter):
    m = target.modifiers.new("cut", "BOOLEAN")
    m.operation = "DIFFERENCE"
    m.object = cutter
    try:
        m.solver = "EXACT"
    except Exception:
        pass
    select_only(target)
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


# ---------------------------------------------------------------- materials
def metal(name, color, rough, coat=0.0, aniso=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")

    def s(k, v):
        if b and k in b.inputs:
            b.inputs[k].default_value = v
    s("Base Color", (*color, 1.0))
    s("Metallic", 1.0)
    s("Roughness", rough)
    s("Anisotropic", aniso)
    s("Coat Weight", coat)
    s("Coat Roughness", 0.04)
    m.diffuse_color = (*color, 1.0)
    m.metallic = 1.0
    m.roughness = rough
    return m


# ---------------------------------------------------------------- build
def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.cameras,
                  bpy.data.lights, bpy.data.images, bpy.data.worlds):
        for d in list(block):
            if d.users == 0:
                block.remove(d)

    alu_body = metal("Aluminium_Gloss", (0.913, 0.918, 0.925), 0.10, coat=0.35, aniso=0.15)
    alu_end = metal("Aluminium_End", (0.900, 0.905, 0.912), 0.18)
    score_m = metal("Score_Line", (0.50, 0.51, 0.53), 0.45)

    # can shell
    verts, faces, seg = lathe(PROFILE, N)
    me = bpy.data.meshes.new("Can_Mesh")
    me.from_pydata(verts, [], faces)
    me.update()
    can = bpy.data.objects.new("Can_Body", me)
    bpy.context.collection.objects.link(can)
    can.data.materials.append(alu_body)
    can.data.materials.append(alu_end)
    for p, k in zip(can.data.polygons, seg):
        p.material_index = 1 if k >= END_START else 0
    smooth(can, 35.0)
    parts = [can]

    # tab: outline with finger hole + rivet slot cut through
    tab_z0, tab_th = PANEL_Z + 0.06, 0.75
    tab = prism("Tab", catmull_closed(mirror_half(TAB_OUTLINE)), tab_z0, tab_th)
    for nm, hole in (("cut_finger", FINGER_HOLE), ("cut_slot", RIVET_SLOT)):
        boolean_cut(tab, prism(nm, catmull_closed(mirror_half(hole)), tab_z0 - 1, tab_th + 2))
    tab.data.materials.append(alu_end)
    bev = tab.modifiers.new("Curl", "BEVEL")       # rolled tab edges
    bev.width = 0.30 * MM
    bev.segments = 3
    bev.limit_method = "ANGLE"
    smooth(tab, 40.0)
    parts.append(tab)

    # rivet head on top of the tab
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1.0,
                                         location=(0, 0, (tab_z0 + tab_th) * MM))
    rivet = bpy.context.object
    rivet.name = "Rivet"
    rivet.scale = (1.85 * MM, 1.85 * MM, 0.55 * MM)
    rivet.data.materials.append(alu_end)
    smooth(rivet, 80)
    parts.append(rivet)

    # sealed pour panel: score line + raised reinforcing bead
    parts.append(tube("Pour_Score", catmull_closed(mirror_half(POUR_SCORE)),
                      PANEL_Z - 0.08, 0.20, score_m))
    parts.append(tube("Panel_Bead", catmull_closed(mirror_half(BEAD)),
                      PANEL_Z - 0.10, 0.55, alu_end))

    us = bpy.context.scene.unit_settings
    us.system = "METRIC"
    us.length_unit = "MILLIMETERS"
    us.scale_length = 1.0
    return can, parts


def brimful_ml(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    v = abs(bm.calc_volume()) * 1e6     # m^3 -> ml
    bm.free()
    return v


# ---------------------------------------------------------------- studio
def studio():
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    hdri_path = os.path.join(bpy.utils.system_resource("DATAFILES"),
                             "studiolights", "world", "interior.exr")
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    if os.path.exists(hdri_path):
        env.image = bpy.data.images.load(hdri_path, check_existing=True)
    bg_env = nt.nodes.new("ShaderNodeBackground")
    bg_env.inputs[1].default_value = 0.45
    nt.links.new(env.outputs[0], bg_env.inputs[0])
    bg_plain = nt.nodes.new("ShaderNodeBackground")       # what the camera sees
    bg_plain.inputs[0].default_value = (0.62, 0.63, 0.65, 1.0)
    bg_plain.inputs[1].default_value = 1.0
    lp = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(bg_env.outputs[0], mix.inputs[1])
    nt.links.new(bg_plain.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])

    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, 0))
    floor = bpy.context.object
    floor.name = "Studio_Floor"
    fm = bpy.data.materials.new("Floor")
    fm.use_nodes = True
    fb = fm.node_tree.nodes.get("Principled BSDF")
    fb.inputs["Base Color"].default_value = (0.36, 0.37, 0.39, 1.0)
    fb.inputs["Roughness"].default_value = 0.6
    floor.data.materials.append(fm)

    def strip(name, loc, rot, w, h, energy):
        d = bpy.data.lights.new(name, "AREA")
        d.shape = "RECTANGLE"
        d.size, d.size_y = w, h
        d.energy = energy
        o = bpy.data.objects.new(name, d)
        o.location, o.rotation_euler = loc, rot
        bpy.context.collection.objects.link(o)

    # tall strip softboxes -> crisp vertical highlights on the gloss body
    strip("Strip_L", (-0.30, -0.22, 0.10), (math.radians(90), 0, math.radians(-54)), 0.06, 0.40, 22)
    strip("Strip_R", (0.32, -0.18, 0.10), (math.radians(90), 0, math.radians(60)), 0.06, 0.40, 16)
    strip("Top_Soft", (0.12, 0.10, 0.45), (math.radians(-15), math.radians(15), 0), 0.12, 0.25, 6)

    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    aim(cam, (0.17, -0.30, 0.24), (0, 0, 0.082), 60)

    scene.render.engine = "CYCLES"
    try:
        scene.cycles.samples = 128
        scene.cycles.use_denoising = True
    except Exception:
        pass
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1250
    try:
        scene.view_settings.view_transform = "AgX"
    except Exception:
        pass
    return cam


def aim(cam, loc, target, lens):
    cam.location = loc
    cam.data.lens = lens
    d = mathutils.Vector(target) - mathutils.Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


# ---------------------------------------------------------------- main
def main():
    can, parts = build()
    vol = brimful_ml(can)
    studio()

    out_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath \
        else os.path.expanduser("~/Desktop")
    blend_path = os.path.join(out_dir, "real_can_250ml.blend")
    fbx_path = os.path.join(out_dir, "real_can_250ml.fbx")

    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = can
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)

    fbx_ok, fbx_err = False, None
    try:
        bpy.ops.export_scene.fbx(filepath=fbx_path, use_selection=True,
                                 object_types={"MESH"}, apply_unit_scale=True,
                                 axis_forward="-Z", axis_up="Y",
                                 add_leaf_bones=False, use_mesh_modifiers=True)
        fbx_ok = True
    except Exception as e:
        fbx_err = "".join(traceback.format_exception_only(type(e), e)).strip()

    d = can.dimensions
    return {
        "parts": [o.name for o in parts],
        "dims_mm": [round(v * 1000, 2) for v in d],
        "brimful_ml": round(vol, 1),
        "blend_path": blend_path, "fbx_ok": fbx_ok, "fbx_err": fbx_err,
    }


result = main()
print("RESULT:", result)

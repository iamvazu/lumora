"""Process generated landing images per docs/landing/LANDING_REDESIGN.md section 3.

Usage: python scripts/landing/process_images.py <source_dir>
Picks the newest <name>_*.jpg in source_dir for each spec entry, center-crops to the
target ratio, resizes to the exact spec size, saves WebP (quality 82) into
apps/web/public/landing/, and writes a labelled contact sheet.
"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "apps", "web", "public", "landing")

# (source prefix, output file, width, height)
SPEC = [
    ("hero_creator", "hero-creator.webp", 1600, 2000),
    ("feature_subscriptions", "feature-subscriptions.webp", 1600, 1200),
    ("feature_messages", "feature-messages.webp", 1600, 1200),
    ("feature_live", "feature-live.webp", 1600, 1200),
    ("feature_bundles", "feature-bundles.webp", 1600, 1200),
    ("feature_vault", "feature-vault.webp", 1600, 1200),
    ("profile_creator", "profile-creator.webp", 1400, 1750),
    *[(f"avatar_{i}", f"avatar-{i}.webp", 512, 512) for i in range(1, 7)],
    ("step_1_setup", "step-1-setup.webp", 1200, 900),
    ("step_2_share", "step-2-share.webp", 1200, 900),
    ("step_3_earn", "step-3-earn.webp", 1200, 900),
    ("live_stage", "live-stage.webp", 2400, 1350),
    *[(f"cat_{c}", f"cat-{c}.webp", 900, 1350)
      for c in ["fitness", "music", "art", "fashion", "travel", "coaching", "cosplay", "cooking"]],
    *[(f"persona_{p}", f"persona-{p}.webp", 1200, 1600) for p in ["fitness", "music", "cosplay", "chef"]],
    ("safety_shield", "safety-shield.webp", 1600, 1600),
    ("cta_aurora", "cta-aurora.webp", 2400, 1000),
]


def newest(src_dir: str, prefix: str):
    # Exclude prefixes that are themselves prefixes of other names (e.g. avatar_1 vs avatar_10).
    files = [f for f in glob.glob(os.path.join(src_dir, f"{prefix}_*.jpg"))
             if os.path.basename(f)[len(prefix) + 1:].split(".")[0].isdigit()]
    return max(files, key=os.path.getmtime) if files else None


def crop_resize(img: Image.Image, w: int, h: int) -> tuple[Image.Image, float]:
    target = w / h
    iw, ih = img.size
    if iw / ih > target:
        nw = round(ih * target)
        left = (iw - nw) // 2
        img = img.crop((left, 0, left + nw, ih))
    else:
        nh = round(iw / target)
        top = (ih - nh) // 2
        img = img.crop((0, top, iw, top + nh))
    upscale = w / img.size[0]
    return img.resize((w, h), Image.LANCZOS), upscale


def main() -> None:
    src_dir = sys.argv[1]
    os.makedirs(OUT_DIR, exist_ok=True)
    done, missing = [], []
    for prefix, out, w, h in SPEC:
        src = newest(src_dir, prefix)
        if not src:
            missing.append(out)
            continue
        img, up = crop_resize(Image.open(src).convert("RGB"), w, h)
        path = os.path.join(OUT_DIR, out)
        img.save(path, "WEBP", quality=82, method=6)
        kb = os.path.getsize(path) / 1024
        done.append((out, path, w, h, kb, up))
        print(f"OK   {out:28s} {w}x{h}  {kb:6.0f} KB  upscale x{up:.2f}")
    for m in missing:
        print(f"MISS {m}")
    print(f"\n{len(done)} processed, {len(missing)} missing, total {sum(d[4] for d in done)/1024:.2f} MB")

    # Contact sheet
    cell_w, cell_h, pad, label_h, cols = 320, 320, 16, 40, 5
    rows = (len(done) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cell_w + pad) + pad, rows * (cell_h + label_h + pad) + pad), "#07070A")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
    for i, (out, path, w, h, kb, up) in enumerate(done):
        im = Image.open(path)
        im.thumbnail((cell_w, cell_h))
        x = pad + (i % cols) * (cell_w + pad)
        y = pad + (i // cols) * (cell_h + label_h + pad)
        sheet.paste(im, (x + (cell_w - im.width) // 2, y + (cell_h - im.height) // 2))
        draw.text((x, y + cell_h + 4), f"{i+1}. {out}", fill="#F5F5F7", font=font)
        draw.text((x, y + cell_h + 20), f"{w}x{h} · {kb:.0f} KB", fill="#A1A1AA", font=font)
    sheet_path = os.path.join(src_dir, "landing_contact_sheet.png")
    sheet.save(sheet_path)
    print("Contact sheet:", sheet_path)


if __name__ == "__main__":
    main()

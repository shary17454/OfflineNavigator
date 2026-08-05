from pathlib import Path

from PIL import Image


TARGETS = {
    Path("store_assets/iphone-6.9"): (1320, 2868),
    Path("store_assets/ipad-13"): (2064, 2752),
}


def main() -> None:
    for directory, target_size in TARGETS.items():
        screenshots = sorted(directory.glob("*.png"))
        if len(screenshots) != 5:
            raise RuntimeError(f"Expected 5 screenshots in {directory}, found {len(screenshots)}")
        for path in screenshots:
            with Image.open(path) as source:
                rendered = source.convert("RGB").resize(target_size, Image.Resampling.LANCZOS)
                rendered.save(path, format="PNG", optimize=True)
            print(f"{path}: {target_size[0]}x{target_size[1]}")


if __name__ == "__main__":
    main()

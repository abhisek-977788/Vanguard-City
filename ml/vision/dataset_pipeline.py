"""
Vanguard City — Road Damage Dataset Pipeline (Phase 6)
Prepares, validates, cleans, and splits road damage imagery (potholes, cracks, damaged surfaces).
Outputs standard YOLO format datasets ready for YOLO11 training.
"""
import os
import shutil
import random
from PIL import Image, ImageDraw
import yaml

CLASSES = ["pothole", "longitudinal_crack", "alligator_crack", "damaged_surface"]

class RoadDamageDatasetPipeline:
    def __init__(self, base_dir: str = "data"):
        self.raw_dir = os.path.join(base_dir, "raw", "road_damage")
        self.processed_dir = os.path.join(base_dir, "processed", "yolo_road_damage")
        self.classes = CLASSES

    def generate_synthetic_benchmark_dataset(self, num_samples: int = 120):
        """
        Generates realistic synthetic annotated road damage images for benchmark training
        when external RDD2022 dataset is not pre-downloaded.
        """
        os.makedirs(self.raw_dir, exist_ok=True)
        images_dir = os.path.join(self.raw_dir, "images")
        labels_dir = os.path.join(self.raw_dir, "labels")
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(labels_dir, exist_ok=True)

        print(f"Generating {num_samples} benchmark road damage images in {self.raw_dir}...")
        random.seed(42)

        for i in range(num_samples):
            w, h = 640, 640
            # Asphalt colored background with variations
            base_color = (random.randint(60, 85), random.randint(60, 85), random.randint(60, 85))
            img = Image.new("RGB", (w, h), color=base_color)
            draw = ImageDraw.Draw(img)

            # Draw lane markings
            draw.line([(w // 2, 0), (w // 2, h)], fill=(220, 220, 200), width=6)

            # Add random damage instances
            num_damages = random.randint(1, 3)
            bboxes = []

            for _ in range(num_damages):
                cls_id = random.randint(0, len(self.classes) - 1)
                bx = random.randint(50, w - 180)
                by = random.randint(50, h - 180)
                bw = random.randint(60, 160)
                bh = random.randint(50, 140)

                # Draw damage pattern
                damage_color = (random.randint(20, 40), random.randint(20, 40), random.randint(20, 40))
                if cls_id == 0:  # Pothole (dark oval/ellipse)
                    draw.ellipse([bx, by, bx + bw, by + bh], fill=damage_color, outline=(15, 15, 15), width=3)
                elif cls_id == 1:  # Longitudinal crack (jagged vertical line)
                    pts = [(bx + random.randint(-5, 5), by + step * (bh // 5)) for step in range(6)]
                    draw.line(pts, fill=damage_color, width=random.randint(4, 8))
                elif cls_id == 2:  # Alligator crack (mesh pattern)
                    for step in range(4):
                        draw.line([(bx, by + step * (bh // 4)), (bx + bw, by + step * (bh // 4))], fill=damage_color, width=3)
                        draw.line([(bx + step * (bw // 4), by), (bx + step * (bw // 4), by + bh)], fill=damage_color, width=3)
                else:  # Damaged surface (rough polygon)
                    draw.polygon([(bx, by), (bx + bw, by + 10), (bx + bw - 10, by + bh), (bx + 10, by + bh)], fill=damage_color)

                # YOLO normalized coords (x_center, y_center, width, height)
                x_center = round((bx + bw / 2) / w, 6)
                y_center = round((by + bh / 2) / h, 6)
                norm_w = round(bw / w, 6)
                norm_h = round(bh / h, 6)
                bboxes.append(f"{cls_id} {x_center} {y_center} {norm_w} {norm_h}")

            img_filename = f"road_damage_{i+1:04d}.jpg"
            lbl_filename = f"road_damage_{i+1:04d}.txt"

            img.save(os.path.join(images_dir, img_filename), "JPEG", quality=90)
            with open(os.path.join(labels_dir, lbl_filename), "w") as f:
                f.write("\n".join(bboxes))

        print(f"Generated {num_samples} images and annotation files.")

    def run_pipeline(self, train_ratio=0.7, val_ratio=0.2, test_ratio=0.1):
        """
        Executes: Validate Dataset -> Clean -> Split (Train/Val/Test) -> Generate data.yaml
        """
        raw_images_dir = os.path.join(self.raw_dir, "images")
        raw_labels_dir = os.path.join(self.raw_dir, "labels")

        if not os.path.exists(raw_images_dir) or len(os.listdir(raw_images_dir)) == 0:
            self.generate_synthetic_benchmark_dataset()

        # Gather valid pairs
        image_files = [f for f in os.listdir(raw_images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        valid_pairs = []

        print(f"Validating {len(image_files)} raw images...")
        for img_name in image_files:
            base_name = os.path.splitext(img_name)[0]
            lbl_name = f"{base_name}.txt"
            lbl_path = os.path.join(raw_labels_dir, lbl_name)
            img_path = os.path.join(raw_images_dir, img_name)

            if os.path.exists(lbl_path):
                # Verify non-empty and valid dimensions
                try:
                    with Image.open(img_path) as im:
                        im.verify()
                    valid_pairs.append((img_name, lbl_name))
                except Exception as e:
                    print(f"Skipping corrupted image: {img_name} ({e})")

        print(f"Cleaned dataset: {len(valid_pairs)} valid image-label pairs found.")

        # Split
        random.seed(42)
        random.shuffle(valid_pairs)
        n = len(valid_pairs)
        train_end = int(n * train_ratio)
        val_end = train_end + int(n * val_ratio)

        splits = {
            "train": valid_pairs[:train_end],
            "val": valid_pairs[train_end:val_end],
            "test": valid_pairs[val_end:]
        }

        # Clear and create target directories
        if os.path.exists(self.processed_dir):
            shutil.rmtree(self.processed_dir)

        for split_name, pairs in splits.items():
            img_out = os.path.join(self.processed_dir, split_name, "images")
            lbl_out = os.path.join(self.processed_dir, split_name, "labels")
            os.makedirs(img_out, exist_ok=True)
            os.makedirs(lbl_out, exist_ok=True)

            for img_name, lbl_name in pairs:
                shutil.copy(os.path.join(raw_images_dir, img_name), os.path.join(img_out, img_name))
                shutil.copy(os.path.join(raw_labels_dir, lbl_name), os.path.join(lbl_out, lbl_name))

            print(f"Split '{split_name}': {len(pairs)} samples saved.")

        # Write data.yaml for YOLO11
        yaml_content = {
            "path": os.path.abspath(self.processed_dir),
            "train": "train/images",
            "val": "val/images",
            "test": "test/images",
            "names": {i: name for i, name in enumerate(self.classes)}
        }

        yaml_path = os.path.join(self.processed_dir, "data.yaml")
        with open(yaml_path, "w") as f:
            yaml.dump(yaml_content, f, default_flow_style=False)

        print(f"\nYOLO dataset pipeline completed! Config: {yaml_path}")
        return yaml_path

if __name__ == "__main__":
    pipeline = RoadDamageDatasetPipeline()
    pipeline.run_pipeline()

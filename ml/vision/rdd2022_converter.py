"""
RDD2022 (India) to YOLO11 Dataset Converter
Converts Pascal VOC XML annotations to YOLO normalized format.
Classes:
  0: longitudinal_crack (D00, D01)
  1: transverse_crack (D10, D11)
  2: alligator_crack (D20)
  3: pothole (D40, D43)
"""
import os
import shutil
import random
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Tuple

# Class mapping from RDD2022 code to class index
CLASS_MAP = {
    'D00': 0, 'D01': 0, 'D0w0': 0,  # Longitudinal crack
    'D10': 1, 'D11': 1,              # Transverse crack
    'D20': 2,                        # Alligator crack
    'D40': 3, 'D43': 3,              # Pothole
}

CLASS_NAMES = [
    'longitudinal_crack',
    'transverse_crack',
    'alligator_crack',
    'pothole'
]

def convert_voc_bbox_to_yolo(size: Tuple[int, int], box: Tuple[float, float, float, float]) -> Tuple[float, float, float, float]:
    """Converts (xmin, ymin, xmax, ymax) to (x_center, y_center, width, height) normalized."""
    img_w, img_h = size
    xmin, ymin, xmax, ymax = box
    
    # Clamp coordinates to image boundaries
    xmin = max(0.0, min(float(xmin), img_w))
    xmax = max(0.0, min(float(xmax), img_w))
    ymin = max(0.0, min(float(ymin), img_h))
    ymax = max(0.0, min(float(ymax), img_h))
    
    w = xmax - xmin
    h = ymax - ymin
    
    if w <= 0 or h <= 0:
        return 0, 0, 0, 0
    
    x_center = xmin + w / 2.0
    y_center = ymin + h / 2.0
    
    return round(x_center / img_w, 6), round(y_center / img_h, 6), round(w / img_w, 6), round(h / img_h, 6)

def build_yolo_dataset(
    rdd_india_dir: str = r"D:\Abhisek\Vangaurd\rdd_extracted\India\India\train",
    output_dir: str = r"D:\Abhisek\Vangaurd\vanguard-city\data\rdd2022_india",
    max_samples: int = 2500,
    val_split: float = 0.2,
    seed: int = 42
):
    random.seed(seed)
    xml_dir = os.path.join(rdd_india_dir, "annotations", "xmls")
    img_dir = os.path.join(rdd_india_dir, "images")
    
    # Destination directories
    train_img_dir = os.path.join(output_dir, "images", "train")
    val_img_dir = os.path.join(output_dir, "images", "val")
    train_lbl_dir = os.path.join(output_dir, "labels", "train")
    val_lbl_dir = os.path.join(output_dir, "labels", "val")
    
    for d in [train_img_dir, val_img_dir, train_lbl_dir, val_lbl_dir]:
        os.makedirs(d, exist_ok=True)
        
    xml_files = [f for f in os.listdir(xml_dir) if f.endswith('.xml')]
    print(f"Total XML files found: {len(xml_files)}")
    
    valid_samples = []
    class_stats = {name: 0 for name in CLASS_NAMES}
    
    for xml_file in xml_files:
        xml_path = os.path.join(xml_dir, xml_file)
        base_name = os.path.splitext(xml_file)[0]
        img_file = f"{base_name}.jpg"
        img_path = os.path.join(img_dir, img_file)
        
        if not os.path.exists(img_path):
            continue
            
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            size_elem = root.find("size")
            if size_elem is None:
                continue
            width = int(size_elem.find("width").text)
            height = int(size_elem.find("height").text)
            if width <= 0 or height <= 0:
                continue
                
            yolo_lines = []
            for obj in root.findall("object"):
                name = obj.find("name").text.strip()
                if name in CLASS_MAP:
                    cls_id = CLASS_MAP[name]
                    bndbox = obj.find("bndbox")
                    xmin = float(bndbox.find("xmin").text)
                    ymin = float(bndbox.find("ymin").text)
                    xmax = float(bndbox.find("xmax").text)
                    ymax = float(bndbox.find("ymax").text)
                    
                    xc, yc, w, h = convert_voc_bbox_to_yolo((width, height), (xmin, ymin, xmax, ymax))
                    if w > 0 and h > 0:
                        yolo_lines.append(f"{cls_id} {xc} {yc} {w} {h}")
                        class_stats[CLASS_NAMES[cls_id]] += 1
                        
            # Keep all images with damage + a fraction of clean background images
            valid_samples.append((img_path, base_name, yolo_lines))
        except Exception:
            continue
            
    # Prioritize images with annotations, then sample clean background images
    damaged_samples = [s for s in valid_samples if len(s[2]) > 0]
    clean_samples = [s for s in valid_samples if len(s[2]) == 0]
    
    print(f"Damaged images: {len(damaged_samples)}, Clean background images: {len(clean_samples)}")
    print("Class instances extracted:")
    for cls_name, count in class_stats.items():
        print(f"  {cls_name}: {count}")
        
    # Select balanced subset if max_samples is set
    random.shuffle(damaged_samples)
    random.shuffle(clean_samples)
    
    selected_samples = damaged_samples[:max_samples]
    # Add 15% clean images for background training
    clean_count = int(len(selected_samples) * 0.15)
    selected_samples.extend(clean_samples[:clean_count])
    random.shuffle(selected_samples)
    
    print(f"\nFinal training dataset size: {len(selected_samples)} images")
    
    split_idx = int(len(selected_samples) * (1 - val_split))
    train_set = selected_samples[:split_idx]
    val_set = selected_samples[split_idx:]
    
    print(f"Train split: {len(train_set)} images | Val split: {len(val_set)} images")
    
    for split_name, dataset, img_out, lbl_out in [
        ("train", train_set, train_img_dir, train_lbl_dir),
        ("val", val_set, val_img_dir, val_lbl_dir)
    ]:
        for src_img, base_name, yolo_lines in dataset:
            # Copy image
            dst_img = os.path.join(img_out, f"{base_name}.jpg")
            if not os.path.exists(dst_img):
                shutil.copy2(src_img, dst_img)
            # Write label txt
            dst_lbl = os.path.join(lbl_out, f"{base_name}.txt")
            with open(dst_lbl, "w") as lf:
                lf.write("\n".join(yolo_lines))
                
    # Create dataset yaml for YOLO11
    yaml_content = f"""path: {os.path.abspath(output_dir)}
train: images/train
val: images/val

names:
  0: longitudinal_crack
  1: transverse_crack
  2: alligator_crack
  3: pothole
"""
    yaml_path = os.path.join(output_dir, "rdd2022.yaml")
    with open(yaml_path, "w") as yf:
        yf.write(yaml_content)
        
    print(f"Dataset YAML written to {yaml_path}")
    return yaml_path

if __name__ == "__main__":
    build_yolo_dataset()
